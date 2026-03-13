import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bookingApiHandler = new NodejsFunction(this, 'BookingApiHandler', {
      runtime: Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      entry: '../../apps/api/src/lambda.ts',
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
      },
    });

    const api = new HttpApi(this, 'GymSpotSecureApi', {
      apiName: 'gym-spot-secure-api',
    });

    api.addRoutes({
      path: '/gyms/{id}/capacity',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('CapacityIntegration', bookingApiHandler),
    });

    api.addRoutes({
      path: '/gyms/{id}/book',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('BookingIntegration', bookingApiHandler),
    });
  }
}
