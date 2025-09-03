// src/sms/sms.templates.ts
export class SmsTemplates {
  static readonly PICKUP_CODE = (lockerLocation: string, code: string): string =>
    `Таны илгээмж бэлэн боллоо!\nБайршил: ${lockerLocation}\nКод: ${code}\n\nSmart Locker`;

  static readonly DELIVERY_CODE = (code: string): string =>
    `Таны илгээмж хүргэгдлээ!\nКод: ${code}\n\nSmart Locker`;

  static readonly VERIFICATION_CODE = (code: string): string =>
    `Таны баталгаажуулах код: ${code}\n\nSmart Locker`;

  static readonly WELCOME_MESSAGE = (userName: string): string =>
    `Сайн байна уу ${userName}!\nSmart Locker системд тавтай морилно уу.\n\nSmart Locker`;
}

export class SmsTemplateManager {
  static getTemplate(type: string, params: Record<string, any>): string {
    switch (type) {
      case 'PICKUP_CODE':
        return SmsTemplates.PICKUP_CODE(params.lockerLocation, params.code);
      case 'DELIVERY_CODE':
        return SmsTemplates.DELIVERY_CODE(params.code);
      case 'VERIFICATION_CODE':
        return SmsTemplates.VERIFICATION_CODE(params.code);
      case 'WELCOME_MESSAGE':
        return SmsTemplates.WELCOME_MESSAGE(params.userName);
      default:
        return params.message || 'Default SMS message';
    }
  }

  static validateTemplateParams(type: string, params: Record<string, any>): boolean {
    const requiredParams: Record<string, string[]> = {
      PICKUP_CODE: ['lockerLocation', 'code'],
      DELIVERY_CODE: ['code'],
      VERIFICATION_CODE: ['code'],
      WELCOME_MESSAGE: ['userName']
    };

    const required = requiredParams[type];
    if (!required) return true;

    return required.every(param => params[param] !== undefined && params[param] !== null);
  }
}
