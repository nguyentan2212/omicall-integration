import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ embed }) => {
	embed('body', '<script type="text/javascript" src="https://cdn.omicrm.com/sdk/web/3.0.30/core.min.js"></script>');
});
