import { PrivacyManager } from './PrivacyManager';

describe('PrivacyManager', () => {
    let privacyManager: PrivacyManager;
    const privateMarker = ':::private';

    beforeEach(() => {
        privacyManager = new PrivacyManager(privateMarker);
    });

    test('should initialize properly', () => {
        expect(privacyManager).toBeDefined();
    }); 

    it('should remove content between private markers', () => {
        const content = `This is public content
:::private
This is private content
that should be removed
:::private
This is more public content`;

        const expected = `This is public content
[Private Content Removed]
This is more public content`;

        const result = privacyManager.removePrivateSections(content);
        expect(result).toBe(expected);
    });

    it('should handle content with no private sections', () => {
        const content = 'This is all public content';
        const result = privacyManager.removePrivateSections(content);
        expect(result).toBe(content);
    });

    it('should handle multiple private sections', () => {
        const content = `Public
:::private
Private 1
:::private
Public middle
:::private
Private 2
:::private
Public end`;

        const expected = `Public
[Private Content Removed]
Public middle
[Private Content Removed]
Public end`;

        const result = privacyManager.removePrivateSections(content);
        expect(result).toBe(expected);
    });
});
