import { PrivacyManager } from '../services/PrivacyManager';

// src/services/PrivacyManager.test.ts                                                                                                    
describe('PrivacyManager', () => {                                                                                                        
    let privacyManager: PrivacyManager;                                                                                                     
                                                                                                                                            
    beforeEach(() => {                                                                                                                      
      privacyManager = new PrivacyManager('PRIVATE');                                                                                       
    });                                                                                                                                     
                                                                                                                                            
    test('should remove content between private markers', () => {                                                                           
      const content = 'Public content PRIVATE sensitive info PRIVATE more public content';                                                  
      const result = privacyManager.removePrivateSections(content);                                                                         
      expect(result).toBe('Public content [Private Content Removed] more public content');                                                  
    });                                                                                                                                     
                                                                                                                                            
    test('should handle multiple private sections', () => {                                                                                 
      const content = 'Start PRIVATE secret1 PRIVATE middle PRIVATE secret2 PRIVATE end';                                                   
      const result = privacyManager.removePrivateSections(content);                                                                         
      expect(result).toBe('Start [Private Content Removed] middle [Private Content Removed] end');                                          
    });                                                                                                                                     
                                                                                                                                            
    test('should handle multiline private content', () => {                                                                                 
      const content = 'Public\nPRIVATE\nLine 1\nLine 2\nPRIVATE\nMore public';                                                              
      const result = privacyManager.removePrivateSections(content);                                                                         
      expect(result).toBe('Public\n[Private Content Removed]\nMore public');                                                                
    });                                                                                                                                     
                                                                                                                                            
    test('should handle no private sections', () => {                                                                                       
      const content = 'All public content';                                                                                                 
      const result = privacyManager.removePrivateSections(content);                                                                         
      expect(result).toBe('All public content');                                                                                            
    });                                                                                                                                     
                                                                                                                                            
    test('should handle unclosed private markers', () => {                                                                                  
      const content = 'Public PRIVATE unclosed section';                                                                                    
      const result = privacyManager.removePrivateSections(content);                                                                         
      expect(result).toBe('Public PRIVATE unclosed section');                                                                               
    });                                                                                                                                     
}); 

// describe('PrivacyManager', () => {
//     let privacyManager: PrivacyManager;
//     const privateMarker = ':::private';

//     beforeEach(() => {
//         privacyManager = new PrivacyManager(privateMarker);
//     });

//     test('should initialize properly', () => {
//         expect(privacyManager).toBeDefined();
//     }); 

//     it('should remove content between private markers', () => {
//         const content = `This is public content
// :::private
// This is private content
// that should be removed
// :::private
// This is more public content`;

//         const expected = `This is public content
// [Private Content Removed]
// This is more public content`;

//         const result = privacyManager.removePrivateSections(content);
//         expect(result).toBe(expected);
//     });

//     it('should handle content with no private sections', () => {
//         const content = 'This is all public content';
//         const result = privacyManager.removePrivateSections(content);
//         expect(result).toBe(content);
//     });

//     it('should handle multiple private sections', () => {
//         const content = `Public
// :::private
// Private 1
// :::private
// Public middle
// :::private
// Private 2
// :::private
// Public end`;

//         const expected = `Public
// [Private Content Removed]
// Public middle
// [Private Content Removed]
// Public end`;

//         const result = privacyManager.removePrivateSections(content);
//         expect(result).toBe(expected);
//     });
// });
