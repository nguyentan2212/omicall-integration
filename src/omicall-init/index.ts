import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ embed }) => {
	// Embed OmiCall SDK script
	embed('body', '<script type="text/javascript" src="https://cdn.omicrm.com/sdk/web/3.0.30/core.min.js"></script>');
	
	// Add a simple script that waits for the SDK and initializes it
	embed('body', `
		<script type="text/javascript">
			window.omicallInit = function() {
				if (typeof window.OMICallSDK !== 'undefined') {
					console.log('OmiCall SDK loaded, initializing...');
					
					// Initialize with default settings
					window.OMICallSDK.init({
						lng: 'vi',
						ui: {
							toggleDial: 'show',
							dialPosition: 'right'
						}
					}).then(function(initResult) {
						if (initResult) {
							console.log('OmiCall SDK initialized successfully');
							window.omicallInitialized = true;
						} else {
							console.error('Failed to initialize OmiCall SDK');
						}
					}).catch(function(error) {
						console.error('OmiCall SDK initialization error:', error);
					});
				} else {
					// Retry after a short delay if SDK not yet loaded
					setTimeout(window.omicallInit, 100);
				}
			};
			
			// Start initialization when DOM is ready
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', window.omicallInit);
			} else {
				window.omicallInit();
			}
		</script>
	`);
});
