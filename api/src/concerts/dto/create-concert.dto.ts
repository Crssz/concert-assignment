import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateConcertDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  totalSeats: number;
}
