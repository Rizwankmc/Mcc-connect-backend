import AWS from 'aws-sdk';

    AWS.config.update({
        region: 'us-east-2'
      })
 
    const S3_BUCKET = process.env.S3_BUCKET_NAME;

    export const sign_s3 = async (buffer, name, type) => {
      try{
        const s3 = new AWS.S3({
          accessKeyId: 'AKIAWFTM346Y35PMDXJA',
          secretAccessKey: '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',
          // signatureVersion: 'v4',
        }); 

        const s3Params = {
            Bucket: 'playerloungestorage',
            Body: buffer,
            Key: `${name}.${type}`,
            Expires: 500,
            ACL: 'public-read',
            // 'Content-Type': type,
          };
          const url = s3.upload(s3Params).promise();
            return url;
        } catch (err) {
          console.log("Error in Image Uplaod =>",err);
        }
    }

