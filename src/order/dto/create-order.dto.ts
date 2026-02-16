import {
  ArrayNotEmpty,
  IsInt,
  IsPositive,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;
}

export class CreateOrderDto {
  @Type(() => OrderItemDto)
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  items!: OrderItemDto[];
}
