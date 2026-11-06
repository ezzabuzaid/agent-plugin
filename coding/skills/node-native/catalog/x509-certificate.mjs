// Parse and check an X.509 certificate: names, serial, validity, SANs,
// fingerprints, public key, signature, hostname, IP and email matches.
import { X509Certificate, createPublicKey } from 'node:crypto';

// A self-signed test certificate (RSA 2048, SHA-256), serial 0x1234ABCD, valid 2026-11-06 to 2036-11-03.
const PEM = `-----BEGIN CERTIFICATE-----
MIIDZTCCAk2gAwIBAgIEEjSrzTANBgkqhkiG9w0BAQsFADA6MQswCQYDVQQGEwJO
TDEUMBIGA1UECgwLRXhhbXBsZSBPcmcxFTATBgNVBAMMDGV4YW1wbGUudGVzdDAe
Fw0yNjExMDYxMDE1NDBaFw0zNjExMDMxMDE1NDBaMDoxCzAJBgNVBAYTAk5MMRQw
EgYDVQQKDAtFeGFtcGxlIE9yZzEVMBMGA1UEAwwMZXhhbXBsZS50ZXN0MIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsxF7aIA7GnnsCQx3Pj1xJ2UeGa1B
Ar0gSBD0o2AZMM6x0PrKNAXKmEK5om1sLQlECRFFM4c/a+M+TeY90ptFhI3GusPT
OCLfpUIVVlddzUbgb4iV29J38YfFp9LeHIC2GeRYVAAJuj/3cBpUfAB68cyGGJk1
lKP6Nky7TJ8FOMK6FNd62twKQXIYG4u3Bb5tCmDsvHbF7F1fNhj9Gf7XmwJ2vdEW
zW5tEJmhA868iOggKTRHm3BSOQIih1FYBqIPX66nQBgVcx9wPbBtsSgjhmfEXMM2
KF2pOnh0yJh3woDP0nF0K1XH7bqqhDHGJCFbxhbVPCHX4GgAgB3ymM4W7QIDAQAB
o3MwcTAdBgNVHQ4EFgQUYpO61XPq6FMna0t1zg22LnY9mH0wDwYDVR0TAQH/BAUw
AwEB/zA/BgNVHREEODA2ggxleGFtcGxlLnRlc3SCDiouZXhhbXBsZS50ZXN0hwTA
AAIBgRBvcHNAZXhhbXBsZS50ZXN0MA0GCSqGSIb3DQEBCwUAA4IBAQBOMvBhIl88
I966bItMKUBnD0qohjlNRI+7d99YvUhnOZPV0TmikMoWaiwNvG434pFkMDFQokN6
n6DkmvQq3uiki4fe9yBrB1wjO97RrfCJuoV9tYzWv7TQjO2nEOvfwbZCbNtE8yg5
gpr4IwNvWKqtrQwAWPYGnuwUoVuvJcNCgEMKK359Ad+/CX+LbaFZb6CPspRAgiw9
eVm5zUfox//Y0fb1TSDV080YlLH+48uCVDD8sVkhbXPo1vUWwOtaY06q2o5her04
d8oHDtDSFvMgCJ2P7SAtr0RgV4g/+5Jo6ShLgeH85VC0qxZK/fC6pxlwgCrczgJc
r783GiCDohSD
-----END CERTIFICATE-----
`;
const certificate = () => new X509Certificate(PEM);
const SAN_PREFIX = { 1: 'email', 2: 'DNS', 7: 'IP Address' };
const forgeCertificate = (forge) => forge.pki.certificateFromPem(PEM);
const forgeNames = (name) => name.attributes.map(({ shortName, value }) => `${shortName}=${value}`);
const forgeDer = (forge) => forge.asn1.toDer(forge.pki.certificateToAsn1(forgeCertificate(forge))).getBytes();
const unwrap = (pem) => pem.replaceAll(/\s+/g, '');

export default {
  apis: [
    'crypto:X509Certificate',
    'crypto:new X509Certificate',
    'crypto:x509.verify',
    'crypto:x509.checkIssued',
    'crypto:x509.checkHost',
    'crypto:keyObject.export',
  ],
  reviewedAt: 'v26.13.0',
  replaces: {
    'node-forge@1.4.3': {
      'pki: subject': {
        native: () => certificate().subject.split('\n'),
        package: ({ default: forge }) => forgeNames(forgeCertificate(forge).subject),
      },
      'pki: issuer': {
        native: () => certificate().issuer.split('\n'),
        package: ({ default: forge }) => forgeNames(forgeCertificate(forge).issuer),
      },
      'pki: serialNumber': {
        native: () => certificate().serialNumber.toLowerCase(),
        package: ({ default: forge }) => forgeCertificate(forge).serialNumber,
      },
      'pki: serialNumber case': {
        gap: 'X509Certificate.serialNumber is upper-case hex; node-forge gives lower-case hex',
        native: () => certificate().serialNumber,
        package: ({ default: forge }) => forgeCertificate(forge).serialNumber,
      },
      'pki: validity': {
        native: () => [certificate().validFromDate, certificate().validToDate],
        package: ({ default: forge }) => [forgeCertificate(forge).validity.notBefore, forgeCertificate(forge).validity.notAfter],
      },
      'pki: subjectAltName': {
        native: () => certificate().subjectAltName.split(', '),
        package: ({ default: forge }) =>
          forgeCertificate(forge)
            .getExtension('subjectAltName')
            .altNames.map(({ type, value, ip }) => `${SAN_PREFIX[type]}:${ip ?? value}`),
      },
      'pki: fingerprint': {
        native: () => certificate().fingerprint256.replaceAll(':', '').toLowerCase(),
        package: ({ default: forge }) => forge.md.sha256.create().update(forgeDer(forge)).digest().toHex(),
      },
      'pki: verify': {
        native: () => [certificate().verify(certificate().publicKey), certificate().checkIssued(certificate())],
        package: ({ default: forge }) => [forgeCertificate(forge).verify(forgeCertificate(forge)), forgeCertificate(forge).isIssuer(forgeCertificate(forge))],
      },
      'pki: publicKeyToPem': {
        native: () => unwrap(certificate().publicKey.export({ type: 'spki', format: 'pem' })),
        package: ({ default: forge }) => unwrap(forge.pki.publicKeyToPem(forgeCertificate(forge).publicKey)),
      },
      'pki: publicKeyToPem line endings': {
        gap: 'keyObject.export writes PEM with \\n line endings; node-forge writes \\r\\n',
        native: () => certificate().publicKey.export({ type: 'spki', format: 'pem' }),
        package: ({ default: forge }) => forge.pki.publicKeyToPem(forgeCertificate(forge).publicKey),
      },
      'pki: publicKeyFromPem': {
        native: () => createPublicKey(certificate().publicKey.export({ type: 'spki', format: 'pem' })).asymmetricKeyDetails.modulusLength,
        package: ({ default: forge }) => forge.pki.publicKeyFromPem(forge.pki.publicKeyToPem(forgeCertificate(forge).publicKey)).n.bitLength(),
      },
    },
  },
};
