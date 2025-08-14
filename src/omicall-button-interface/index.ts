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
    // SIP Configuration
    {
      field: 'sipRealm',
      name: 'SIP Realm',
      type: 'string',
      meta: { 
        width: 'full', 
        interface: 'input',
        note: 'Enter the SIP domain/realm for your phone system'
      }
    },
    {
      field: 'sipUser',
      name: 'Extension Number',
      type: 'string',
      meta: { 
        width: 'half', 
        interface: 'input',
        note: 'Your internal extension number'
      }
    },
    {
      field: 'sipPassword',
      name: 'Extension Password',
      type: 'string',
      meta: { 
        width: 'half', 
        interface: 'input-password',
        note: 'Password for your extension'
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
