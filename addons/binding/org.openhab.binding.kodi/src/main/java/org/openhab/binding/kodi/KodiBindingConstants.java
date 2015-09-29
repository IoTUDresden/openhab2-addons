/**
 * Copyright (c) 2014-2015 openHAB UG (haftungsbeschraenkt) and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 */
package org.openhab.binding.kodi;

import org.eclipse.smarthome.core.thing.ThingTypeUID;

/**
 * The {@link KodiBinding} class defines common constants, which are 
 * used across the whole binding.
 * 
 * @author Andre Kuehnert - Initial contribution
 */
public class KodiBindingConstants {

    public static final String BINDING_ID = "kodi";
    
    // List of all Thing Type UIDs
    public final static ThingTypeUID THING_TYPE_KODICONTROL = new ThingTypeUID(BINDING_ID, "kodicontrol");

    // List of all Channel ids
    /**
     * Sends or receive a notification from/to Kodi
     */
    public final static String CHANNEL_GUI_SHOW_NOTIFICATION_CHANNEL = "gui-show-notification";
    
    /**
     * Plays the given file
     */
    public final static String CHANNEL_PLAY_FILE = "player-play-file";
    
    /**
     * The friendly name of the Kodi instance
     */
    public final static String CHANNEL_FRIENDLY_NAME = "friendly-name";
    
    /**
     * Uptime from Kodi
     */
    public final static String CHANNEL_UPTIME = "uptime";
    
    //List of all Parameters
    /**
     * The IP of the Kodi Instance
     */
    public final static String PARAMETER_IP = "ip";
    
    /**
     * The Display time describes how long the message should be vissible in Kodi.
     */
    public final static String PARAMETER_DISPLAYTIME = "displaytime";
    
    /**
     * The refreshtime for main information (e.g. uptime)
     */
    public final static String PARAMETER_REFRESHTIME = "refreshtime";
    
    

}