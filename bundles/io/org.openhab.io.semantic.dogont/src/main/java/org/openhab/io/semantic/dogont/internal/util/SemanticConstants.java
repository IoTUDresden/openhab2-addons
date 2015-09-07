package org.openhab.io.semantic.dogont.internal.util;

/**
 * Constants for the work with the semantic model.
 * 
 * @author André Kühnert
 *
 */
public class SemanticConstants {
	//TODO the files should be located in a openhab config folder, not in this bundle
	
	private SemanticConstants() {
		// no need for a instance of this
	}
	
//	/**
//	 * Base path to the tdb folder
//	 */
//	public static final String TDB_PATH_BASE = "Data/";
//	
//	/**
//	 * Path for the openhab item instances model
//	 */
//	public static final String TDB_PATH_OPENHAB = "OpenHABInstances";
	
	/**
	 * namespace for the openhab dogont instances 
	 */
	public static final String NS_INSTANCE = "http://openhab-semantic/0.1/instance#";
	
	/**
	 * namepsace for the dogont schema
	 */
	public static final String NS_SCHEMA = "http://elite.polito.it/ontologies/dogont.owl#";
	
	/**
	 * Thing_ prefix for the individual names, of the type 'BuildingThing'
	 */
	public static final String THING_PREFIX = "Thing_";
	
	/**
	 * State_ prefix for the individual names, of the type 'State'
	 */
	public static final String STATE_PREFIX = "State_";
	
	/**
	 * Function_ prefix for individual names, of the type 'Functionality'
	 */
	public static final String FUNCTION_PREFIX = "Function_";
	
	/**
	 * the complete prefix incl. dogont namespace and thing prefix for 'BuildingThings'
	 */
	public static final String NS_AND_THING_PREFIX = NS_INSTANCE + THING_PREFIX;
	
	/**
	 * path to the instances
	 */
	public static final String INSTANCE_FILE = "semantic/resource/instance/openhab_instances.ttl";
	
	/**
	 * base path to the local models 
	 */
	public static final String DEFAULT_ONTOLOGY_PATH = "file:semantic/resource/models/";
	
	/**
	 * The Turtle language definition as string
	 */
	public static final String TURTLE_STRING = "TURTLE";
	
	/**
	 * Namespace for the rdfs (rdf-schema)
	 */
	public static final String NS_RDFS_SCHEMA = "http://www.w3.org/2000/01/rdf-schema#";
	
	/**
	 * Namespace for the rdf (rdf-syntax)
	 */
	public static final String NS_RDF_SYNTAX = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";

}
