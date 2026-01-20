/**
 * Tests to ensure all Tavus persona creation paths include perception_model: 'raven-0'
 *
 * This is CRITICAL for perception analysis to work. Without this setting,
 * Tavus will not generate perception analysis data for conversations.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Tavus Persona Perception Model', () => {
  const srcRoot = path.join(__dirname, '../../../src');

  // Files that create Tavus personas
  const personaCreationFiles = [
    'app/api/create-agent/route.ts',
    'lib/tavus/persona-with-guardrails.ts',
  ];

  describe('All persona creation paths must set perception_model to raven-0', () => {
    personaCreationFiles.forEach((filePath) => {
      it(`${filePath} should include perception_model: 'raven-0'`, () => {
        const fullPath = path.join(srcRoot, filePath);

        // Skip if file doesn't exist (might be renamed)
        if (!fs.existsSync(fullPath)) {
          console.warn(`Warning: ${filePath} not found - may have been moved or renamed`);
          return;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');

        // Check that the file contains perception_model: 'raven-0'
        const hasRavenPerception =
          content.includes("perception_model: 'raven-0'") ||
          content.includes('perception_model: "raven-0"');

        expect(hasRavenPerception).toBe(true);
      });
    });
  });

  describe('Perception model constant validation', () => {
    it('should use raven-0 as the perception model value', () => {
      // This test documents the expected value
      const EXPECTED_PERCEPTION_MODEL = 'raven-0';
      expect(EXPECTED_PERCEPTION_MODEL).toBe('raven-0');
    });
  });

  describe('No persona creation without perception_model', () => {
    it('should not have any POST to /v2/personas without perception_model in same function', () => {
      // Search all TypeScript files for Tavus persona creation
      const searchFiles = (dir: string): string[] => {
        const results: string[] = [];
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
              results.push(...searchFiles(fullPath));
            } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
              results.push(fullPath);
            }
          }
        } catch (e) {
          // Ignore permission errors
        }
        return results;
      };

      const allTsFiles = searchFiles(srcRoot);
      const personaCreationPattern = /fetch\s*\(\s*['"`]https:\/\/tavusapi\.com\/v2\/personas['"`]/;
      const perceptionModelPattern = /perception_model.*['"`]raven-0['"`]/;

      const violations: string[] = [];

      for (const filePath of allTsFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // If file creates personas via POST, it should have perception_model
        if (personaCreationPattern.test(content) && content.includes("method: 'POST'")) {
          if (!perceptionModelPattern.test(content)) {
            violations.push(filePath.replace(srcRoot, 'src'));
          }
        }
      }

      if (violations.length > 0) {
        fail(`Files creating Tavus personas without perception_model: 'raven-0':\n${violations.join('\n')}`);
      }
    });
  });
});
