import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatePaymentDto, CreateInvoiceDto, PaymentStatsDto } from './dto';
import { UserRole } from '@prisma/client';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('invoice')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Delivery order not found' })
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.paymentService.createInvoice(createInvoiceDto, req.user.role);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payment (legacy endpoint)' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    // Convert to invoice format for consistency
    const invoiceDto = {
      deliveryId: createPaymentDto.deliveryId,
      amount: createPaymentDto.amount,
      description: createPaymentDto.description,
    };
    return this.paymentService.createInvoice(invoiceDto, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getAllPayments(@Request() req) {
    return this.paymentService.getAllPayments(req.user.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPaymentStats(): Promise<PaymentStatsDto> {
    return this.paymentService.getPaymentStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getPaymentById(id);
  }

  @Get('delivery/:deliveryId')
  @ApiOperation({ summary: 'Get payments by delivery ID' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPaymentsByDelivery(@Param('deliveryId', ParseIntPipe) deliveryId: number) {
    return this.paymentService.getPaymentsByDelivery(deliveryId);
  }

  @Get('history/user')
  @ApiOperation({ summary: 'Get payment history for current user' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(@Request() req) {
    return this.paymentService.getPaymentHistory(req.user.id);
  }

  @Get('history/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all payment history (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllPaymentHistory() {
    return this.paymentService.getPaymentHistory();
  }

  @Post('verify/:paymentId/:deliveryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify payment with QPay (usually called by QPay callback)' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 404, description: 'Payment or delivery not found' })
  async verifyInvoice(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Param('deliveryId', ParseIntPipe) deliveryId: number,
  ) {
    return this.paymentService.verifyInvoice(paymentId, deliveryId);
  }

  @Get('check/:invoiceId')
  @ApiOperation({ summary: 'Check payment status by invoice ID' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async checkPaymentWithInvoice(@Param('invoiceId') invoiceId: string) {
    return this.paymentService.checkPaymentWithInvoice(invoiceId);
  }

  @Delete(':id/cancel')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async cancelPayment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.paymentService.cancelPayment(id, req.user.role);
  }

  // Legacy endpoint for backward compatibility
  @Get('verify/:paymentId/:deliveryId')
  @ApiOperation({ summary: 'Legacy verify endpoint (GET instead of POST)' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  async legacyVerifyInvoice(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Param('deliveryId', ParseIntPipe) deliveryId: number,
  ) {
    return this.paymentService.verifyInvoice(paymentId, deliveryId);
  }
}
