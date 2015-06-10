package org.openhab.io.semantic.internal;

import java.io.ByteArrayOutputStream;

import org.eclipse.smarthome.core.items.Item;
import org.eclipse.smarthome.core.items.ItemNotFoundException;
import org.eclipse.smarthome.core.items.ItemRegistry;
import org.eclipse.smarthome.core.thing.Thing;
import org.eclipse.smarthome.core.thing.ThingRegistry;
import org.openhab.io.semantic.core.QueryResult;
import org.openhab.io.semantic.internal.ontology.DogontSchema;
import org.openhab.io.semantic.internal.util.QueryResource;
import org.openhab.io.semantic.internal.util.SemanticConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.hp.hpl.jena.ontology.Individual;
import com.hp.hpl.jena.ontology.OntModel;
import com.hp.hpl.jena.ontology.OntModelSpec;
import com.hp.hpl.jena.query.Query;
import com.hp.hpl.jena.query.QueryExecution;
import com.hp.hpl.jena.query.QueryExecutionFactory;
import com.hp.hpl.jena.query.QueryFactory;
import com.hp.hpl.jena.query.QuerySolution;
import com.hp.hpl.jena.query.ResultSet;
import com.hp.hpl.jena.rdf.model.Model;
import com.hp.hpl.jena.rdf.model.ModelFactory;
import com.hp.hpl.jena.rdf.model.Resource;
import com.hp.hpl.jena.rdf.model.Statement;

/**
 * The SemanticManager handels all operations with the ontology models.
 * 
 * @author André Kühnert
 * 
 */
public class SemanticManager {
	private static final Logger logger = LoggerFactory.getLogger(SemanticManager.class);
	private ItemRegistry itemRegistry;
	private ThingRegistry thingRegistry;

	private OntModel openHabInstancesModel;

	/**
	 * Default constructor.
	 * 
	 * Reads the semantic instances and checks if all things/items, which are added in openHAB, have
	 * an instance in the semantic model.
	 */
	public SemanticManager(ItemRegistry itemRegistry, ThingRegistry thingRegistry) {
		//TODO the registries must be removed, in order to enable the correct implementation of the bundle
		this.itemRegistry = itemRegistry;
		this.thingRegistry = thingRegistry;
		logger.debug("creating semantic models");
		createModels();
		checkPresenceOfIndividuals();
	}

	/**
	 * Executes a query, with the select statement
	 * 
	 * @param queryAsString
	 * @return null if queryAsString is null or empty
	 */
	public QueryResult executeQuery(String queryAsString) {
		return executeQuery(queryAsString, true);
	}

	/**
	 * Executes a query, with the select statement
	 * 
	 * @param queryAsString
	 * @param withLatestValues
	 *            if set to true, this will fill the result set with the latest values for the devices
	 * @return
	 */
	public QueryResult executeQuery(String queryAsString, boolean withLatestValues) {
		if (queryAsString == null || queryAsString.isEmpty())
			return null;
		if(withLatestValues)
			addCurrentItemStatesToModelRealStateValues();
		Query query = QueryFactory.create(queryAsString);
		QueryExecution qe = QueryExecutionFactory.create(query, openHabInstancesModel);
		ResultSet resultSet = qe.execSelect();;
		QueryResult queryResult = new QueryResultImpl(resultSet);
		qe.close();
		return queryResult;
	}

	public String selectBuildingThing(String uid) {
		return null;
	}

	/**
	 * Gets the complete instance model as an string
	 * 
	 * @return
	 */
	public String getInstanceModelAsString() {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		openHabInstancesModel.write(out);
		return new String(out.toByteArray());
	}

	/**
	 * Closes all models.
	 */
	public void close() {
		logger.debug("closing all models");
		openHabInstancesModel.close();
	}
	
	public void addCurrentItemStatesToModelRealStateValues() {
		Query query = QueryFactory.create(QueryResource.BuildingThingsContainingStateValue);
		QueryExecution qe = QueryExecutionFactory.create(query, openHabInstancesModel);
		ResultSet results = qe.execSelect();		
		while (results.hasNext())
			addValueToModel(results.next());
		qe.close();		
	}
	
	private void addValueToModel(QuerySolution qs){
		Resource state = qs.getResource("state");
		Resource value = qs.getResource("value");
		if(state == null || value == null)
			return;
		Item item = getItemWithModelStateLocalName(state.getLocalName());
		if(item == null)
			return;
//		Individual valueIndividual = openHabInstancesModel.getIndividual(value.getURI());
//		if(valueIndividual == null){
//			logger.error("the StateValue individual '{}' cannot be found in the model", value.getURI());
//			return;
//		}
//		valueIndividual.removeAll(DogontSchema.realStateValue);
//		valueIndividual.addProperty(DogontSchema.realStateValue, item.getState().toString());
		Statement stmt = value.getProperty(DogontSchema.realStateValue);
		stmt.changeObject(item.getState().toString());
	}
	
	private Item getItemWithModelStateLocalName(String localName){
		if(localName.startsWith(SemanticConstants.STATE_PREFIX)){
			logger.warn("the state '{}' does not have the correct name prefix", localName);
			return null;
		}
		localName = localName.replaceFirst(SemanticConstants.STATE_PREFIX, "");	
		return getItem(localName);		
	}
	
	private Item getItem(String name){
		try {
			return itemRegistry.getItem(name);
		} catch (ItemNotFoundException e) {
			logger.error("Item with name '{}' not found. Wrong name in the instance model?", name);
			return null;
		}
	}

	private void createModels() {
		Model modelInstances = ModelFactory.createDefaultModel();
		OntModelSpec spec = new OntModelSpec(OntModelSpec.OWL_MEM);
		openHabInstancesModel = ModelFactory.createOntologyModel(spec, modelInstances);
		openHabInstancesModel.read(SemanticConstants.INSTANCE_FILE, SemanticConstants.TURTLE_STRING);
	}

	private void checkPresenceOfIndividuals() {
		Individual individual = null;
		String thingUid = null;
		for (Thing thing : thingRegistry.getAll()) {
			thingUid = thing.getThingTypeUID().getAsString();
			individual = openHabInstancesModel.getIndividual(SemanticConstants.NS_AND_THING_PREFIX + thingUid);
			if (individual == null) {
				logger.warn(
						"An instance of the thing with uid '{}' was not found in the semantic instance model.",
						thingUid);
				addSimpleThing(thing);
			}
		}
	}

	private void addSimpleThing(Thing thing) {
		// TODO generate a simple semantic annotation to complete the semantic model
	}
}
