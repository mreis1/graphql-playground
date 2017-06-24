var http = require('http'),
	server = http.createServer(),
	express = require('express'),
	app = express(server),
	graphql = require('graphql').graphql,
	buildSchema = require('graphql').buildSchema,
	graphqlHTTP = require('express-graphql');

var {   GraphQLID,
	 	GraphQLSchema,
	 	GraphQLInt,
	 	GraphQLString,
	 	GraphQLBoolean,
	 	GraphQLObjectType,
	 	GraphQLNonNull,
	 	GraphQLList,
	 	GraphQLInputObjectType,
	 	GraphQLInterfaceType } = require('graphql');
/**
Graphql-relay

The GraphQL Relay Specification requires that a GraphQL 
Schema has some kind of mechanism for re-fetching an object. 
For typical Relay-compliant servers, this is going to be the
 Node Interface. In this video, we’ll add in the Node
  interface to a GraphQL Schema by using the helpers 
  available in the graphql-relay npm package.


1. List all videos
{
  "data": {
    "videos": [
      {
        "id": "VmlkZW86MTIz",	<--- our ids are now base64 and contain the followin the information about the object and the id itself. For example this id contains  "Video:123" where 123 is the real id        
        "title": "Film A"
      },
      {
        "id": "VmlkZW86MTI0",
        "title": "Film B"
      }
    ]
  },
  "extensions": {
    "runTime": 3
  }
}




{
  node(id:"VmlkZW86MTIz")
  {
    ... on Video {
      title,
      id
    }
  }
}

will output:
{
  "data": {
    "node": {
      "title": "Film A",
      "id": "VmlkZW86MTIz"
    }
  },
  "extensions": {
    "runTime": 28
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

const {
	nodeDefinitions,
	fromGlobalId,
	globalIdField
} = require('graphql-relay')



const {nodeInterface, nodeField} = nodeDefinitions(
	( globalId ) => {
		const {
			type, id
		} = fromGlobalId(globalId);
		// ex: type=Video, id=124 
		return getObjectById(type, id);
	}, ( object ) => {
		// so we are basically inferring that all 
		// objects with title property are of type videoType
		if (object.title){
			return videoType;
		}
		return null;
	}
)

const getObjectById = (type, id) => {
	const types = {
		video: findVideoById,
	}

	// we receive Video but our types properties are lower case
	// so we call toLowerCase here, otherwise we would see 
	// "types[type] is not a function" as error
	return types[type.toLowerCase()](id);
}


const videos = [videoA, videoB]

const videoType = new GraphQLObjectType({
	name: 'Video',
	description: 'A video',
	fields: {
		id: globalIdField(), // <-- for relay
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
	},
	interfaces: [nodeInterface]
})

const queryType = new GraphQLObjectType({
	name: 'QueryType',
	description: 'The root query type.',
	fields: {
		node: nodeField,
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