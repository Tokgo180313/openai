import { EncryptionService } from './utils/encryption.service';
import { Module, Global } from '@nestjs/common';
@Global()
@Module({
    providers: [EncryptionService],
    exports: [EncryptionService],
})
export class CommonModule { }