import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Prisma, type Order } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { firstValueFrom } from 'rxjs';

interface ValidatedProduct {
  id: number;
  price: number | string;
  name: string;
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('PRODUCT_SERVICE') private productClient: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const ids = createOrderDto.items.map((item) => item.productId);

    let validatedProducts: ValidatedProduct[];
    try {
      
      validatedProducts = await firstValueFrom(
        this.productClient.send<ValidatedProduct[]>(
          { cmd: 'validate_products' },
          { productIds: ids },
        ),
      );
    } catch (error) {
  
      return this.handleError(
        HttpStatus.BAD_REQUEST,
        'Product validation failed',
        error,
      );
    }

    const productsMap = new Map(
      validatedProducts.map((product) => [product.id, product]),
    );

    try {
      const orderItemsData = createOrderDto.items.map((item) => {
        const product = productsMap.get(item.productId);
      
        if (!product) {
          this.handleError(
            HttpStatus.BAD_REQUEST,
            `Product ${item.productId} is invalid`,
          );
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: new Prisma.Decimal(product.price),
        };
      });

      const totalPriceValue = orderItemsData.reduce(
        (sum, item) => sum + item.price.toNumber() * item.quantity,
        0,
      );

      const data: Prisma.OrderCreateInput = {
        status: 'pending',
        totalPrice: new Prisma.Decimal(totalPriceValue),
        orderItems: {
          createMany: {
            data: orderItemsData,
          },
        },
      };
      
      return await this.prisma.order.create({ data });
    } catch (error) {
      console.log(error)
      this.handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to create order',
        error,
      );
    }
  }

  async findAll(): Promise<Order[]> {
    try {
      const data = await this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });
      
      return data;
    } catch (error) {
      this.handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to list orders',
        error,
      );
    }
  }

  async findOne(id: string): Promise<Order> {
    try {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (!order) {
        return this.handleError(HttpStatus.NOT_FOUND, `Order ${id} not found`);
      }
      return order;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      this.handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Failed to fetch order ${id}`,
        error,
      );
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: updateOrderDto,
      });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        this.handleError(HttpStatus.NOT_FOUND, `Order ${id} not found`);
      }
      this.handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update order ${id}`,
        error,
      );
    }
  }

  async remove(id: string): Promise<Order> {
    try {
      return await this.prisma.order.delete({ where: { id } });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        this.handleError(HttpStatus.NOT_FOUND, `Order ${id} not found`);
      }
      this.handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete order ${id}`,
        error,
      );
    }
  }

  private isRecordNotFound(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2025'
    );
  }

  private handleError(status: number, message: string, error?: unknown): never {
    const details = error instanceof Error ? error.message : error;
    throw new RpcException({ status, message, details });
  }
}
