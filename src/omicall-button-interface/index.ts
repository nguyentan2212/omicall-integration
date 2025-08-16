import { defineInterface } from '@directus/extensions-sdk';
import OmiCallButton from './interface.vue';

export default defineInterface({
  id: 'omicall-call-button',
  name: 'OmiCall – Call Button',
  icon: 'phone',
  description: 'Make customer calls through OmiCall from Directus',
  types: ['string'],
  group: 'presentation',
  component: OmiCallButton,
  options: [
    // SIP Configuration Collection
    {
      field: 'sipConfigCollection',
      name: 'SIP Configuration Collection',
      type: 'string',
      meta: { 
        width: 'full', 
        interface: 'input',
        note: 'Collection name containing SIP configurations (e.g., "sip_configs")'
      }
    },
    // Field Mapping Configuration
    {
      field: 'sipRealmField',
      name: 'SIP Realm Field',
      type: 'string',
      meta: { 
        width: 'half', 
        interface: 'input',
        note: 'Field name containing the SIP realm/domain (e.g., "sip_realm" or "domain")'
      }
    },
    {
      field: 'sipUserField',
      name: 'SIP User Field',
      type: 'string',
      meta: { 
        width: 'half', 
        interface: 'input',
        note: 'Field name containing the extension number (e.g., "sip_user" or "extension")'
      }
    },
    {
      field: 'sipPasswordField',
      name: 'SIP Password Field',
      type: 'string',
      meta: { 
        width: 'half', 
        interface: 'input',
        note: 'Field name containing the extension password (e.g., "sip_password" or "password")'
      }
    },
    {
      field: 'userField',
      name: 'User ID Field',
      type: 'string',
      meta: { 
        width: 'half', 
        interface: 'input',
        note: 'Field name containing the Directus user ID (e.g., "user" or "user_id")'
      }
    },
    // Phone Field Configuration
    {
      field: 'phoneField',
      name: 'Phone Number Field',
      type: 'string',
      meta: { 
        width: 'full', 
        interface: 'input',
        note: 'Field name containing the customer phone number'
      }
    },
    // UI Configuration
    {
      field: 'lng',
      name: 'Interface Language',
      type: 'string',
      schema: { default_value: 'en' },
      meta: {
        width: 'half',
        interface: 'select-dropdown',
        options: { 
          choices: [
            { text: 'English', value: 'en' },
            { text: 'Vietnamese', value: 'vi' },
            { text: 'Khmer', value: 'km' }
          ] 
        },
        note: 'Language for the call button interface'
      }
    },
    {
      field: 'useDefaultUI',
      name: 'Use Default SDK UI',
      type: 'boolean',
      schema: { default_value: true },
      meta: { 
        width: 'half', 
        interface: 'boolean',
        note: 'Use the default OmiCall SDK interface'
      }
    }
  ]
});
