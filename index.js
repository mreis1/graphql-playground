var http = require('http'),
	server = http.createServer(),
	express = require('express'),
	app = express(server),
	graphql = require('graphql').graphql,
	buildSchema = require('graphql').buildSchema,
	graphqlHTTP = require('express-graphql');

var GraphQLID = require('graphql').GraphQLID;
var GraphQLSchema = require('graphql').GraphQLSchema;
var GraphQLInt = require('graphql').GraphQLInt;
var GraphQLString = require('graphql').GraphQLString;
var GraphQLBoolean = require('graphql').GraphQLBoolean;
var GraphQLObjectType = require('graphql').GraphQLObjectType;
var GraphQLNonNull = require('graphql').GraphQLNonNull;
var GraphQLList = require('graphql').GraphQLList;
var GraphQLInputObjectType = require('graphql').GraphQLInputObjectType;
/**


mutation M {
  createVideo(video: {
    title: "Awesome New Video", 
    watched: true, 
    duration: 12312
  }) 
  {
   	id,
    title,
    duration
  }
}

will procude: 
{
  "data": {
    "createVideo": {
      "id": "536174204a756e20323420323031372031323a35373a343620474d542b3032303020284345535429",
      "title": "Awesome New Video",
      "duration": 12312
    }
  },
  "extensions": {
    "runTime": 5
  }
}

*/

const videoA = {
	id: 123,
	watched: true,
	duration: 1203,
	title: 'Film A'
}
const videoB = {
	id: 124,
	watched: true,
	duration: 1203,
	title: 'Film B'
}

const videos = [videoA, videoB]

const videoType = new GraphQLObjectType({
	name: 'Video',
	description: 'A video',
	fields: {
		id: {
			type: GraphQLID,
			description: 'The video id'
		},
		title: {
			type: GraphQLString,
			description: 'The video title'
		},
		duration: {
			type: GraphQLInt,
			description: 'The video duration'
		},
		watched: {
			type: GraphQLBoolean,
			description: 'The video watched state'
		}
	}
})

const queryType = new GraphQLObjectType({
	name: 'QueryType',
	description: 'The root query type.',
	fields: {
		videos: {
			type: new GraphQLList(videoType),
			resolve: function(){
				return videos;
			}
		},
		video: {
			type: videoType,
			args: {
				id: {
					type: new GraphQLNonNull(GraphQLID),
					description: 'The movie id'
				}	
			},
			resolve: (_, args) => {
				return findVideoById(args.id)
			}
		}
	}
})

const videoInputType = new GraphQLInputObjectType({
	name: 'VideoInputType',
	fields: {
		// id: {
		// 	type: new GraphQLNonNull(GraphQLID),
		// 	description: 'The video id'
		// },
		title: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'The video title'
		},
		duration: {
			type: new GraphQLNonNull(GraphQLInt),
			description: 'The video duration'
		},
		watched: {
			type: new GraphQLNonNull(GraphQLBoolean),
			description: 'The video watched state'
		}
	}
})

const mutationType = new GraphQLObjectType({
	name: 'Mutation',
	description: 'The root mutation type.',
	fields: {
		createVideo: {
			type: videoType,
			args: {
				video: {
					type: new GraphQLNonNull(videoInputType)
				}
			},
			resolve: function(_, args){
				return createVideo(args.video)
			}
		}
	}
})

const mySchema = new GraphQLSchema({
	query: queryType,
	mutation: mutationType
})

const createVideo = ({title, duration, watched}) => {
	return new Promise((resolve)=>{
		let video = {
			id: new Buffer(new Date().toString()).toString('hex'),
			title,
			duration,
			watched
		};
		videos.push(video)
		resolve(video);
	})
}
const findVideoById = (id) => {
	return new Promise((resolve)=>{
		const [video] = videos.filter((video) => {
			return video.id == id;
		})	
		
		resolve(video);
	})
}


app.use('/graphql', graphqlHTTP(() => {
   const startTime = Date.now()
   return {
	  schema: mySchema,
	  graphiql: true,
	  extensions({ document, variables, operationName, result }) {
		  return { runTime: Date.now() - startTime };
	  }
  }
}));



app.listen(8080)