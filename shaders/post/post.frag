uniform float time;

uniform bool bSSAO;
uniform bool bLighting;
uniform bool bDrawColor;

uniform sampler2D tex;
uniform sampler2D depthTex;
uniform sampler2D pickTex;
uniform sampler2D shadowTex; // rendered shadow texture
uniform sampler2D fxTex; //rendered picking texture

uniform mat4 lightViewMatrix;
uniform mat4 lightProjectionMatrix;

uniform mat4 cameraMatrix;
uniform mat4 projectionMatrix;
uniform mat4 cameraInverse;
uniform mat4 projectionInverse;

varying vec2 texCoord;

// Depth of Field variables

    vec2 tc_offset[25];

    float PI = 3.14159265358979323846264;

//Ambient Occlusion variables:

    vec2 screensize = vec2 (768,768 );

	float d;


	float pw =  1.0/screensize.x ;  //stepping horizontal
	float ph =  1.0/screensize.y ;  //stepping vertical


	float ao = 0.0;                 //ambient AO

    float samples = 8.0;            //number of sample circles
	float circleRes= 8.0;           //samples per circle
    float stepsize = 2.0;          //distance of next point in pixels

	float aoMultiplier=10.0;        //progressive darkening
	float falloff =1.15;

    float minDepth=0.05;           //minimum distance to take into account
    float maxDepth=6.0;            //maximum distance to take into account


    float aspect =45.0;             //field of view ratio

    float objectID=0.0;

/***********************************************

    Depth of Field

***********************************************/

/*
*   5x5 Kernel Gaussian Blur
*/

vec4 blur(sampler2D myTex){

      float spread=1.0/32.0; // * 10.0/texture2D(depthTex,texCoord).a;

      tc_offset[0]=spread * vec2(-2.0,-2.0);
      tc_offset[1]=spread * vec2(-1.0,-2.0);
      tc_offset[2]=spread * vec2(0.0,-2.0);
      tc_offset[3]=spread * vec2(1.0,-2.0);
      tc_offset[4]=spread * vec2(2.0,-2.0);

      tc_offset[5]=spread * vec2(-2.0,-1.0);
      tc_offset[6]=spread * vec2(-1.0,-1.0);
      tc_offset[7]=spread * vec2(0.0,-1.0);
      tc_offset[8]=spread * vec2(1.0,-1.0);
      tc_offset[9]=spread * vec2(2.0,-1.0);

      tc_offset[10]=spread * vec2(-2.0,0.0);
      tc_offset[11]=spread * vec2(-1.0,0.0);
      tc_offset[12]=spread * vec2(0.0,0.0);
      tc_offset[13]=spread * vec2(1.0,0.0);
      tc_offset[14]=spread * vec2(2.0,0.0);

      tc_offset[15]=spread * vec2(-2.0,1.0);
      tc_offset[16]=spread * vec2(-1.0,1.0);
      tc_offset[17]=spread * vec2(0.0,1.0);
      tc_offset[18]=spread * vec2(1.0,1.0);
      tc_offset[19]=spread * vec2(2.0,1.0);

      tc_offset[20]=spread * vec2(-2.0,2.0);
      tc_offset[21]=spread * vec2(-1.0,2.0);
      tc_offset[22]=spread * vec2(0.0,2.0);
      tc_offset[23]=spread * vec2(1.0,2.0);
      tc_offset[24]=spread * vec2(2.0,2.0);


      vec4 sample[25];

      for (int i=0 ; i<25 ; i++)
      {
        sample[i]=texture2D(myTex , texCoord + tc_offset[i]);
      }

      vec4 blurredColor=(
                        (1.0 * (sample[0] + sample[4] + sample[20] + sample[24])) +

                        (4.0 * (sample[1] + sample[3] + sample[5] + sample[9] +
                               sample[15] + sample[19] + sample[21] + sample[23])) +

                        (7.0 * (sample[2] + sample[10] + sample[14] + sample[22])) +

                        (16.0 * (sample[6] + sample[8] + sample[16] + sample[18])) +

                        (26.0 * (sample[7] + sample[11] + sample[13] + sample[17])) +
                        (41.0 * sample[12])
                        )/ 273.0;
      blurredColor.a=1.0;
      return(blurredColor);
}



vec4 blur3(sampler2D myTex, vec2 tc){

      vec4 sample[9];

      float spread=1.0/600.0  * 8.0/texture2D(myTex , tc).a;

      tc_offset[0]=spread * vec2(-1.0,-1.0);
      tc_offset[1]=spread * vec2(0.0,-1.0);
      tc_offset[2]=spread * vec2(1.0,-1.0);

      tc_offset[3]=spread * vec2(-1.0,0.0);
      tc_offset[4]=spread * vec2(0.0,0.0);
      tc_offset[5]=spread * vec2(1.0,0.0);

      tc_offset[6]=spread * vec2(-1.0,-1.0);
      tc_offset[7]=spread * vec2(0.0,-1.0);
      tc_offset[8]=spread * vec2(1.0,-1.0);

      for (int i=0 ; i<9 ; i++)
      {
        if (ceil(texture2D(pickTex , tc + tc_offset[i]).a) == objectID)
            sample[i]=texture2D(myTex , tc + tc_offset[i]);
        else
            sample[i]=texture2D(myTex , tc);
      }

      vec4 blurredColor=(
                         sample[0] + (2.0* sample[1]) + sample[2] +
                         (2.0*sample[3]) + sample[4] + (2.0*sample[5]) +
                         sample[6] + (2.0* sample[7]) + sample[8]
                        )/ 13.0;
      //blurredColor.a=1.0;
      return(blurredColor);
}


/*
*   compute Depth of Field
*/

vec4 computeDOF() {

    vec4 depthValue= texture2D(depthTex, texCoord);

    vec4 blurPart=blur(tex);

    vec4 sharpPart=  texture2D(tex,texCoord);
    sharpPart.a=1.0;

    float focus = 5.0+ 5.0 * sin(time * 0.00051);
    focus= 25.0;
    float combineBack =min(1.0,depthValue.a/focus);
    float combineFront = min(1.0,focus/depthValue.a);

    float combine = min(combineFront * combineFront , combineBack * combineBack);
    //combine = min(combineFront , combineBack);
    combine =clamp (combine, 0.0, 1.0);
    vec4 dofColor = (1.0-combine)* blurPart + combine * sharpPart ;
    //dofColor=vec4(depthValue.a/100.0);
    dofColor.a=1.0;

    return dofColor;
}




/***********************************************

    Ambient Occlusion

***********************************************/

/*
*   read Pixel Info
*/

vec4 readPixelInfo( in vec2 coord ) {

    return  texture2D( depthTex, coord ) ;

}

vec4 readObjectInfo( in vec2 coord ) {

    return  texture2D( pickTex, coord ) ;

}
/*
*   compare Ambient Occlusion Samples
*/

void compareAOSamples(float depth, vec3 n1, int j){

    float dist,  l, l2;
    vec3 nDist, vDist, v1, v2, n2;

    //vec4 pixelInfo=readPixelInfo( vec2(texCoord.x+ sin(float(j) * PI/circleRes ) * pw,texCoord.y+ cos(float(j) * PI/circleRes ) * ph));
    vec4 pixelInfo=readPixelInfo( vec2(texCoord.x + pw,texCoord.y + ph));

    n2=pixelInfo.rgb;
    d=pixelInfo.a;

    n1=normalize(n1);
    n2=normalize(n2);
    float cutOff=0.99;

    //this is done because our normals are not 100% perfect.
    //so we need to be more lenient when it comes to self-occlusion!
/*
    int compareObjectID=ceil(texture2D(pickTex,vec2(texCoord.x + pw,texCoord.y + ph)).a);
    if (objectID==compareObjectID){
        cutOff=0.9;
    }
*/

    if ( abs(dot(n2,n1))< cutOff && abs(depth-d)<abs(d/depth))
        ao+=max(1.0 * aoMultiplier * (depth-d)/depth,0.0);
        //ao+=aoMultiplier;
    return;
}

/*
*   compute AO
*/

vec4 computeAO(){

    vec4 pixelInfo=readPixelInfo( texCoord );

    float depth = pixelInfo.a;
    vec3 n1=pixelInfo.xyz;

    if (floor(readObjectInfo(texCoord).a)<0.0)
        return vec4(1.0,1.0,1.0,1.0);


    for (int i=1; i<int(samples+1.0); i++){

        for (int j=0; j<int(circleRes);j++){

            pw= cos(float(j)/(circleRes-1.0) * (2.0 *PI)) * float(i) * stepsize/screensize.x;
            ph= sin(float(j)/(circleRes-1.0) * (2.0 *PI)) * float(i) * stepsize/screensize.y;

            compareAOSamples(depth, n1, j);
        }

        aoMultiplier/=falloff;
    }

	ao/= (samples* stepsize);

	vec4 aoColor = vec4(1.0-ao);
	//aoColor =  vec4(depth/100.0);
	//aoColor =  vec4(ao);
	//aoColor.a=1.0;

	return aoColor;
}


/*
*	Smudge FX
*/

vec4 smudge(vec2 coord){


		float smudgeSamples=8.0;
		float step=1.0/1024.0;

		vec2 smudge=texture2D(fxTex,coord).xy;

//        if (length(smudge)<0.1)
//            smudge=vec2(0.2,0.1);


		vec4 smudgeColor=gl_FragColor * texture2D(shadowTex,texCoord);

		if (objectID<0.0)
			return smudgeColor;

		if (smudge == smudge*0.0)
			return smudgeColor;

		for (int i=0;i<int(smudgeSamples);i++){
			vec2 myCoord = vec2(texCoord.x + float(i) * smudge.x * step,texCoord.y + float(i) * smudge.y * step);
			vec2 myNegCoord = vec2(texCoord.x - float(i) * smudge.x * step,texCoord.y - float(i) * smudge.y * step);
			smudgeColor+=texture2D(tex, myCoord) * texture2D(shadowTex,myCoord);
			smudgeColor+=texture2D(tex, myNegCoord) * texture2D(shadowTex,myNegCoord);
		}
		smudgeColor*=1.0/(smudgeSamples * 2.0);
		smudgeColor.a=1.0;

		//debug
		//smudgeColor.xy=smudge;
		//smudgeColor.b=0.0;

		return smudgeColor;
}

/*
*   Main
*/

void main(void){


    ///color map
    if (bDrawColor)
        gl_FragColor=texture2D(tex, texCoord);
    else
    ///lighting only
        gl_FragColor=vec4(1.0,1.0,1.0,1.0);

    objectID=ceil(texture2D(pickTex,texCoord).a);

    ///Ambient Occlusion
    if (bSSAO)
        gl_FragColor.rgb*=computeAO().rgb ;

    ///regular shadows
    //if we have negative values in our first channel, we are unlit!
    if (bLighting){
        vec4 lightData=texture2D(shadowTex,texCoord);
        if (lightData.r>=0.0)
            gl_FragColor*=lightData;
    }

    ///blurred shadows
    //gl_FragColor*=blur3(shadowTex,texCoord);

    ///smudging
	//gl_FragColor=smudge(texCoord);


    ///debug stuff
    //gl_FragColor/=3.0;
    //gl_FragColor.rgb=texture2D(shadowTex, texCoord).rgb;
    //gl_FragColor.g+=0.0001 * texture2D(pickTex, texCoord).g;
    //gl_FragColor.b+=0.0001 * texture2D(depthTex, texCoord).b;
    //gl_FragColor.a=1.0;
    //gl_FragColor.rgb=texture2D(depthTex, texCoord).rgb;
    //gl_FragColor.rgb=texture2D(depthTex, texCoord).a/100.0;
    //gl_FragColor.b=texture2D(depthTex, texCoord).a/100.0;
    //vec3 norm=readNormal(texCoord);
    //gl_FragColor.xyz+=0.10 * norm;

    //gl_FragColor.r=1.0;
    //gl_FragColor.a=1.0;
}
