import { App } from 'aws-cdk-lib';
import { ApiStack } from './api-stack';

const app = new App();

new ApiStack(app, 'GymSpotSecureStack');
