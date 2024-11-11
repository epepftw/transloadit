import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import Uppy from '@uppy/core';
import Transloadit from '@uppy/transloadit';
import Dashboard from '@uppy/dashboard';
import GoogleDrive from '@uppy/google-drive';
import Dropbox from '@uppy/dropbox';
import { COMPANION_URL, COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import { FileSizePipe } from '../../pipes/file-size.pipe';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import { ReplacePipe } from '../../pipes/replace.pipe';

@Component({
  selector: 'uploader',
  standalone: true,
  imports: [CommonModule, FileSizePipe, ReplacePipe],
  templateUrl: './uploader.component.html',
})
export class UploaderComponent implements OnInit, OnDestroy {
  private uppy: any;

  isUploading = signal(false);
  progress = signal(0);
  files = signal<any[]>([]);
  error = signal<string | null>(null);
  currentStage = signal<string | undefined>(undefined);
  currentFile = signal<string | undefined>(undefined);
  totalFiles = signal<number | undefined>(undefined);
  currentFileIndex = signal<number | undefined>(undefined);
  isEncoding = signal(false);
  encodingProgress = signal(0);

  totalUploadedFiles = computed(() => this.files().length);
  hasError = computed(() => !!this.error());

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    effect(() => {
      if (this.isUploading()) {
        console.log(`Upload progress: ${this.progress()}%`);
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeUppy();
    }
  }

  private initializeUppy() {
    this.uppy = new Uppy({ debug: false, autoProceed: false })
      .use(Dashboard, {
        target: '#uppy-dashboard',
        inline: true,
        showProgressDetails: true,
        height: 470,
        metaFields: [
          { id: 'name', name: 'Name', placeholder: 'Rename your file' },
        ],
        showRemoveButtonAfterComplete: true,
        thumbnailHeight: 200,
        waitForThumbnailsBeforeUpload: true,
      })
      .use(ThumbnailGenerator, {
        thumbnailWidth: 200,
        thumbnailHeight: 200,
        waitForThumbnailsBeforeUpload: true,
      })
      .use(Dropbox, {
        companionUrl: COMPANION_URL,
        companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
      })
      .use(GoogleDrive, {
        companionUrl: COMPANION_URL,
        companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
      })
      .use(Transloadit, {
        assemblyOptions: {
          params: {
            auth: { key: 'e2da7231d6c64061a09ee39515362e01' },
            template_id: 'c79b582a62494264b37f023cfc882c64',
          },
        },
        waitForEncoding: true,
      });

    this.uppy.setOptions({
      restrictions: {
        allowedFileTypes: ['image/*', 'video/*'],
        maxNumberOfFiles: 10,
      },
    });

    this.setupUppyListeners();
  }

  private setupUppyListeners() {
    this.uppy
      .on('upload', () => {
        const files = this.uppy.getFiles();
        this.isUploading.set(true);
        this.error.set(null);
      })
      .on('progress', (progress: number) => {
        this.progress.set(progress);
        this.currentStage.set('Uploading');
      })
      .on('transloadit:assembly-created', () => {
        this.currentStage.set('Starting encoding');
        this.isEncoding.set(true);
        this.encodingProgress.set(0);
      })
      .on('transloadit:assembly-executing', () => {
        this.currentStage.set('Encoding');
        this.isEncoding.set(true);
      })
      .on('thumbnail:generated', (file: any, preview: any) => {
        console.log('Thumbnail generated for:', file.name, preview);
      })
      .on('complete', async (result: any) => {
        this.isUploading.set(false);
        this.isEncoding.set(false);
        this.progress.set(100);
        this.encodingProgress.set(100);

        const processedFiles = await Promise.all(
          result.successful.map(async (file: any) => {
            // Check for the webm conversion results
            let assemblyResults = file.transloadit?.[0];

            // Fetch assembly details if the conversion results are missing
            if (!assemblyResults) {
              const response = await fetch(file.meta.assembly_url);
              assemblyResults = await response.json();
            }

            // Access the webm-converted file
            const webmFile = assemblyResults.results?.webm_converted?.[0];
            const webmUrl = webmFile?.url || null;

            return {
              ...file,
              thumbnail: assemblyResults.results?.thumbnail?.[0]?.url || null,
              webmUrl: webmUrl, // Store the .webm URL if available
              originalSize: file.size,
              convertedSize: webmFile?.size || file.size,
            };
          })
        );

        console.log('Processed files with .webm URLs:', processedFiles);
        this.files.update((files) => [...files, ...processedFiles]);
      })
      .on('error', (error: any) => {
        this.isUploading.set(false);
        this.isEncoding.set(false);
        this.error.set(error.message || 'Upload failed');
      });
  }

  ngOnDestroy() {
    if (this.uppy) {
      this.uppy.close();
    }
  }
}
