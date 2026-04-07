import { Body, Controller, Get, Param, Post, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, CreateInvoiceDto, CheckInvoiceDto } from './dto';
@ApiTags('payment')


@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createInvoice(createPaymentDto);
  }

  @Get('verify/:paymentId/:deliveryId')
  public async verifyInvoice(
      @Param('paymentId') paymentId: string,
      @Param('deliveryId') deliveryId: string,
  ) {
      this.logger.log(`Verifying payment: ${paymentId} for deliveryId: ${deliveryId}`);
      return await this.paymentService.verifyInvoice(paymentId, deliveryId);
  }

  @Get('checkPayment/:invoiceId')
  public async checkPaymentWithInvoice(
      @Param('invoiceId') invoiceId: string,
  ): Promise<any> {
      this.logger.log(`Checking payment with invoice: ${invoiceId}`);
      return await this.paymentService.checkPaymentWithInvoice(invoiceId);
  }
}
