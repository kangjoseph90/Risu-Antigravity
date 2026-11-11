import { getAllArgNames, RISU_ARGS, QUICK_BACKUP } from "../plugin";
import { Logger } from "./logger";
import { RisuAPI } from "../api";
import { ModelManager } from "../model"
import { downloadFile, readFileAsText } from "../shared/util";
import { AppEvent, eventEmitter } from "./events";

interface BackupData {
    version: string;
    timestamp: string;
    data: {
        [key: string]: string;
    };
}

/**
 * backup,
 * restore,
 * hasBackup,
 * getBackupTimestamp
 */
export class BackupManager {
    private static readonly VERSION = '1.0';

    static async backup(): Promise<boolean> {
        try {
            const backupData = await this.gatherData();

            // Keep credential backups in this plugin’s scoped arguments.
            await this.saveBackup(backupData);
            return true;
        } catch (e) {
            Logger.error('Backup failed:', e);
            return false;
        }
    }

    static async restore(): Promise<boolean> {
        try {
            const backupData = await this.loadBackup();
            
            if (!backupData) {
                Logger.warn('No backup found');
                return false;
            }

            await this.applyData(backupData);

            return true;
        } catch (e) {
            Logger.error('Restore failed:', e);
            return false;
        }
    }

    static async exportBackupToFile(): Promise<boolean> {
        try {
            const backupData = await this.gatherData();
            const jsonString = JSON.stringify(backupData, null, 2);
            const date = new Date().toISOString().split('T')[0];
            downloadFile(jsonString, `risu-antigravity-backup-${date}.json`, 'application/json');
            return true;
        } catch (e) {
            Logger.error('Export failed:', e);
            return false;
        }
    }

    static async importBackupFromFile(file: File): Promise<boolean> {
        return this.importBackupFromText(await readFileAsText(file));
    }

    static async importBackupFromText(jsonString: string): Promise<boolean> {
        try {
            const backupData = JSON.parse(jsonString) as BackupData;

            // Basic validation
            if (!backupData || backupData.version !== this.VERSION || !backupData.data || typeof backupData.data !== 'object' || Array.isArray(backupData.data)) {
                throw new Error('Invalid or incompatible backup file.');
            }

            await this.applyData(backupData);
            return true;
        } catch (e) {
            Logger.error('Import failed:', e);
            return false;
        }
    }

    private static async gatherData(): Promise<BackupData> {
        await ModelManager.flush();
        const backupData: BackupData = {
            version: this.VERSION,
            timestamp: new Date().toISOString(),
            data: {}
        };

        // 등록된 모든 arg 데이터 수집 (자동)
        const argNames = getAllArgNames();
        for (const argName of argNames) {
            const value = (await RisuAPI.getArg(argName));
            if (value !== undefined) {
                backupData.data[argName] = String(value);
            }
        }
        return backupData;
    }

    private static async applyData(backupData: BackupData): Promise<void> {
        await ModelManager.flush();
        // 복구된 데이터를 RisuAPI에 설정 (자동)
        for (const [argName, value] of Object.entries(backupData.data)) {
            if (this.isValidArgName(argName)) {
                await RisuAPI.setArg(argName, value);
            }
        }
        
        eventEmitter.emit(AppEvent.BACKUP_RESTORE);
        await ModelManager.init();
    }

    static async hasBackup(): Promise<boolean> {
        try {
            const backupData = await this.loadBackup();
            return backupData !== null;
        } catch (e) {
            return false;
        }
    }

    static async getBackupTimestamp(): Promise<string | null> {
        try {
            const backupData = await this.loadBackup();
            return backupData?.timestamp || null;
        } catch (e) {
            return null;
        }
    }

    private static async saveBackup(backup: BackupData): Promise<void> {
        await RisuAPI.setArg(QUICK_BACKUP, JSON.stringify(backup));
    }

    private static async loadBackup(): Promise<BackupData | null> {
        const value = await RisuAPI.getArg(QUICK_BACKUP);
        return value ? JSON.parse(String(value)) as BackupData : null;
    }

    private static isValidArgName(argName: string): boolean {
        return argName !== QUICK_BACKUP && Object.prototype.hasOwnProperty.call(RISU_ARGS, argName);
    }

    static async clearBackup(): Promise<boolean> {
        try {
            await RisuAPI.setArg(QUICK_BACKUP, '');
            return true;
        } catch (e) {
            Logger.error('Clear backup failed:', e);
            return false;
        }
    }
}
