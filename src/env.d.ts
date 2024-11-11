interface ImportMetaEnv {
  NG_APP_DROPBOX_CREDS_NAME: string;
  readonly NG_APP_TRANSLOADIT_KEY: string;
  readonly NG_APP_TEMPLATE_ID: string;
  readonly NG_APP_COMPANION_URL: string;
  NG_APP_GDRIVE_CREDS_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
