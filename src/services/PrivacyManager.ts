// src/services/PrivacyManager.ts
export class PrivacyManager {
	constructor(private privateMarker: string) {}

	removePrivateSections(content: string): string {
		const privateRegex = new RegExp(
			`${this.privateMarker}[\\s\\S]*?${this.privateMarker}`,
			"g"
		);
		return content.replace(privateRegex, "[Private Content Removed]");
	}
}
