import { Module, Type, DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from '@shared/infrastructure/database/database.module';
import { AuthModule } from '@auth/auth.module';
import { UserSettingsModule } from '@user-settings/user-settings.module';
import { InviteCodesModule } from '@invite-codes/invite-codes.module';
import { DictionariesModule } from '@dictionaries/dictionaries.module';
import { JwtAuthGuard } from '@auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/presentation/guards/roles.guard';
import { THROTTLE_DEFAULT } from '@shared/presentation/throttle.constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const imports: Array<Type | DynamicModule> = [
  ThrottlerModule.forRoot([THROTTLE_DEFAULT]),
  AuthModule,
  InviteCodesModule,
  UserSettingsModule,
  DictionariesModule,
];

if (process.env.PERSISTENCE_MODE === 'postgres') {
  imports.unshift(DatabaseModule);
}

@Module({
  imports,
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
