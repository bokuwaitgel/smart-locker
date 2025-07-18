import { Test, TestingModule } from '@nestjs/testing';
import { SerialController } from './serial.controller';

describe('SerialController', () => {
  let controller: SerialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SerialController],
    }).compile();

    controller = module.get<SerialController>(SerialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
