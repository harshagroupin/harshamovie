declare module "paytmchecksum" {
  const PaytmChecksum: {
    generateSignature(
      data: string,
      key: string
    ): Promise<string>;
    verifySignature(
      data: string,
      key: string,
      checksum: string
    ): boolean;
  };
  export default PaytmChecksum;
}
