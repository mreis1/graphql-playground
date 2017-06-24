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
Use Relay’s Input Object Mutations

Convert GraphQL List Type to a Relay Connection Type
In order to support mutations in Relay, there is a
requirement that the GraphQL Server exposes mutation 
fields in a standardized way. This standard includes 
a way for mutations to accept and emit an identifier string,
allowing Relay to track mutations and responses. This code
shows how to use a helper available to us 
(mutationWithClientMutationId) through 
graphql-relay to create Mutation fields that accept 
clientMutationId’s.



//ATTENTION we use a exclamation point after AddVideoInput
mutation AddVideoQuery($input: AddVideoInput!){
  createVideo(input:$input){
    video{
      id,
      title
    }
  }
}


with the following query vars

{
  "input": {
    "title": "My new movie",
    "duration": 123213,
    "watched": true
  }
}


outputs


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
	globalIdField,
	connectionArgs,
	connectionFromPromisedArray,
	connectionDefinitions,
	mutationWithClientMutationId
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

// define our connectionType

/* 
Just a note about this syntax:
This is the same 

var VideoConnection = {
    connectionType: "fooo"
}.connectionType;*/

const { connectionType: VideoConnection } = connectionDefinitions({
	nodeType: videoType,
	connectionFields: () => ({
		totalCount: {
			type: GraphQLInt,
			description: 'A count of existing total objects in this connection',
			resolve: (conn) => {
				return conn.edges.length;
			}
		}
	})
})

const queryType = new GraphQLObjectType({
	name: 'QueryType',
	description: 'The root query type.',
	fields: {
		node: nodeField,
		videos: {
			type: VideoConnection,
			args: connectionArgs,
			resolve: (_, args) => connectionFromPromisedArray(
				getVideos(), //a promise that resolves with an array
				args
			)
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


const videoMutation = mutationWithClientMutationId({
	name: 'AddVideo',
	inputFields: {
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
	},
	outputFields: {
		video: {
			type: videoType
		}
	},
	mutateAndGetPayload: (args) => new Promise((resolve, reject) => {
		Promise.resolve(createVideo(args))
			.then((video) => resolve({ video }))
			.catch(reject);
	})
})
const mutationType = new GraphQLObjectType({
	name: 'Mutation',
	description: 'The root mutation type.',
	fields: {
		createVideo: videoMutation
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

const getVideos = () => {
	return new Promise((resolve) => {
		resolve(videos);
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