import { PartialType } from '@nestjs/swagger';
import { CreateDistilleryDto } from './create-distillery.dto';

export class UpdateDistilleryDto extends PartialType(CreateDistilleryDto) {}
