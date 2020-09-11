# async-lookups-in-awscdk

This project is as an example on how to do async lookups before processing cdk synth and generate a CloudFormation resources. Doing async lookups during stack processing is currently not supported in aws-cdk. (https://github.com/aws/aws-cdk/issues/8273)

It is in that way kinda similar to Sceptre hooks/resolvers or Terraform Datasources and expands on the Constructs CDK offers.

