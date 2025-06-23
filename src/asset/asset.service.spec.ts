import { AssetService } from './asset.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
const joinPathSpy = jest.spyOn(path, 'join');
const resolvePathSpy = jest.spyOn(path, 'resolve');

describe('AssetService', () => {
  let assetService: AssetService;
  let configService: ConfigService;

  const mockAssetPath = '/mock/assets';

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'ASSET_PATH') return mockAssetPath;
        return undefined;
      }),
    } as any;
    assetService = new AssetService(configService);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set assetPath from config', () => {
      expect(assetService['assetPath']).toBe(mockAssetPath);
    });

    it('should fallback to default path if config is missing', () => {
      (configService.get as jest.Mock).mockReturnValueOnce(undefined);
      const service = new AssetService(configService);
      expect(service['assetPath']).toBe(path.join(__dirname, '..', 'assets'));
    });
  });

  describe('saveAsset', () => {
    it('should write file and return file path', async () => {
      const fileName = 'test.txt';
      const content = Buffer.from('hello');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await assetService.saveAsset(fileName, content);

      expect(fs.writeFile).toHaveBeenCalledWith(path.join(mockAssetPath, fileName), content);
      expect(result).toBe(fileName);
    });
  });

  describe('readAsset', () => {
    it('should read file and return buffer', async () => {
      const fileName = 'test.txt';
      const buffer = Buffer.from('data');
      (fs.readFile as jest.Mock).mockResolvedValue(buffer);

      const result = await assetService.readAsset(fileName);

      expect(fs.readFile).toHaveBeenCalledWith(path.join(mockAssetPath, fileName));
      expect(result).toBe(buffer);
    });

    it('should throw error if file not found', async () => {
      const fileName = 'missing.txt';
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('not found'));

      await expect(assetService.readAsset(fileName)).rejects.toThrow(`Asset not found: ${fileName}`);
    });

    });

    describe('deleteAsset', () => {
    it('should delete file successfully', async () => {
      const fileName = 'delete.txt';
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await assetService.deleteAsset(fileName);

      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockAssetPath, fileName));
    });

    it('should throw error if deletion fails', async () => {
      const fileName = 'fail.txt';
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('unlink failed'));

      await expect(assetService.deleteAsset(fileName)).rejects.toThrow(`Failed to delete asset: ${fileName}`);
    });
    });
  });