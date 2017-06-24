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

/***
TEST 1: QUERY VIDEO WITH FILTERING BY ID

{
  video(id:123) {
    id,
    title,
    duration
  }
}

will produce: 
{
  "data": {
    "video": {
      "id": "123",
      "title": "Film A",
      "duration": 1203
    }
  },
  "extensions": {
    "runTime": 4
  }
}



TEST 2: QUERYING VIDEOS

{
  videos {
    id,
    title,
    duration
  }
}

prints out
{
  "data": {
    "videos": [
      {
        "id": "123",
        "title": "Film A",
        "duration": 1203
      },
      {
        "id": "124",
        "title": "Film B",
        "duration": 1203
      }
    ]
  },
  "extensions": {
    "runTime": 2
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

const mySchema = new GraphQLSchema({
	query: queryType,

})

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