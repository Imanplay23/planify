import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Asumí este package id (com.<tunombre>.planify) ya que "io.ionic.starter"
  // es el placeholder por defecto y Google Play no lo acepta. Una vez que
  // publiques la app, este id ya NO se puede cambiar — si prefieres otro,
  // cámbialo aquí antes de correr "npx cap add android".
  appId: 'com.imanolvallejo.planify',
  appName: 'Planify',
  webDir: 'www'
};

export default config;
