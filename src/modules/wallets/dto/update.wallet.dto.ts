import { PartialType } from '@nestjs/mapped-types';
import { CreateWalletDto } from './create.wallet.dto.js';

// Kế thừa toàn bộ field của CreateWalletDto nhưng cho phép bỏ trống khi update
export class UpdateWalletDto extends PartialType(CreateWalletDto) { }