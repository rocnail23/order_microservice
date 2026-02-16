import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create_order' })
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_all_orders' })
  findAll() {
    return this.orderService.findAll();
  }

  @MessagePattern({ cmd: 'find_one_order' })
  findOne(@Payload() id: string) {
    return this.orderService.findOne(id);
  }

  @MessagePattern({ cmd: 'update_order' })
  update(@Payload() payload: { id: string; data: UpdateOrderDto }) {
    return this.orderService.update(payload.id, payload.data);
  }

  @MessagePattern({ cmd: 'remove_order' })
  remove(@Payload() id: string) {
    return this.orderService.remove(id);
  }
}
