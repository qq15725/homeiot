export class AccessToken {
  public get userId(): number {
    return this.raw.userId
  }

  public get passToken(): string {
    return this.raw.passToken
  }

  public get ssecurity(): string {
    return this.raw.ssecurity
  }

  public get nonce(): number {
    return this.raw.nonce
  }

  public get location(): string {
    return this.raw.location
  }

  public get notificationUrl(): string | undefined {
    return this.raw.notificationUrl
  }

  constructor(
    public readonly serviceToken: string,
    public readonly raw: Record<string, any>,
    public readonly userAgent: string,
    public readonly deviceId: string,
  ) {
    //
  }
}
