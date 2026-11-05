import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { VoiceStore } from '@/application/ports';

/** documents/voice-diary/<profile>/<file>: private to the app, excluded from sharing unless a parent shares it. */
function folderFor(profileId: string): Directory {
  return new Directory(Paths.document, 'voice-diary', profileId);
}

export function createFileVoiceStore(): VoiceStore {
  const supported = Platform.OS !== 'web';
  return {
    async keep(profileId, recordingUri, fileName) {
      if (!supported) return null;
      try {
        const folder = folderFor(profileId);
        folder.create({ intermediates: true, idempotent: true });
        const target = new File(folder, fileName);
        if (target.exists) target.delete();
        await new File(recordingUri).move(target);
        return fileName;
      } catch {
        return null;
      }
    },
    uriFor(profileId, fileName) {
      if (!supported) return null;
      try {
        const file = new File(folderFor(profileId), fileName);
        return file.exists ? file.uri : null;
      } catch {
        return null;
      }
    },
    async remove(profileId, fileNames) {
      if (!supported) return;
      for (const name of fileNames) {
        try {
          const file = new File(folderFor(profileId), name);
          if (file.exists) file.delete();
        } catch {
          // Already gone.
        }
      }
    },
    async removeAll(profileId) {
      if (!supported) return;
      try {
        const folder = folderFor(profileId);
        if (folder.exists) folder.delete();
      } catch {
        // Nothing to delete.
      }
    },
  };
}
