#!/usr/bin/python3
###############################################################################
# Copyright (C) octoScope, Inc., All Rights Reserved.
#
# This work and its derivatives are the property of octoScope, Inc.,
# and is subject to the terms and conditions defined in the file
# LICENSE.txt.
#
# Unauthorized duplication of this file, via any medium, is strictly
# prohibited.
###############################################################################


# Requires socketio python package to be installed:
#   pip3 install "python-socketio[client]"
#
# Constructor takes 4 parameters:
#   server_addr: Stardust server Ip address (required)
#   namespace: Namespace string (see below chart) (required)
#   event_name: Event name string (see below chart) (required)
#   callback: A custom callback function, takes only message as input (optional)
#
# One namespace/event per class instance
#
# Instance Methods:
#   Start: Opens connection and starts listening
#   Stop: Disconnects and stops listening
#
# Class Methods:
#   get_namespaces: Return the list of recognized namespaces
#   get_events: Return a table of events
#
# Properties:
#   is_connected: Boolean giving connection state

#     Namespaces                               Events
# ------------------------------------------------------------------------------
#     '/ACTIVE_TEST'                           'ALL'
#     '/ATTEN_STATUS'                          'ALL', device IPs
#     '/AUTOTEST_STATUS'                       'ALL'
#     '/AVG_PAL_TELEMETRY'                     'AVG_PAL_TELEMETRY'
#     '/AVG_PING_TELEMETRY'                    'AVG_PING_TELEMETRY'
#     '/AVGRSSI_TELEMETRY'                     'AVGRSSI_TELEMETRY'
#     '/AVGTHROUGHPUT_TELEMETRY'               'AVGTHROUGHPUT_TELEMETRY'
#     '/CHARTS_DATA'                           'ALL'
#     '/ETHERNET_STATUS'                       'ALL'
#     '/GENERAL_ERROR_MESSAGES'                'ALL'
#     '/IPERF2_TELEMETRY'                      'IPERF2_TELEMETRY'
#     '/IPERF3_TELEMETRY'                      'IPERF3_TELEMETRY'
#     '/MPE_STATUS'                            'ALL', device IPs
#     '/PAL_CONFIG_STATUS'                     'ALL'
#     '/PAL_STATUS'                            'ALL', device IPs
#     '/PAL_TELEMETRY'                         'ALL', device IPs
#     '/PAL_TIMESYNC'                          'ALL'
#     '/PING_TELEMETRY'                        'PING_TELEMETRY'
#     '/STATUS_AUTOTEST'                       'ALL'
#     '/THROUGHPUT_STARTED'                    'ALL'
#     '/TURNTABLE_STATUS'                      device IPs
#     '/SNIFFER_STATUS'                        'ALL'


""" Module for listening to and outputting Stardust's socket.io messages """

import ipaddress
import socketio

SOCKETIO_PORT = 4001

VALID_NAMESPACES = [
  '/ACTIVE_TEST',
  '/ATTEN_STATUS',
  '/AUTOTEST_STATUS',
  '/AVG_PAL_TELEMETRY',
  '/AVG_PING_TELEMETRY',
  '/AVGRSSI_TELEMETRY',
  '/AVGTHROUGHPUT_TELEMETRY',
  '/CHARTS_DATA',
  '/ETHERNET_STATUS',
  '/GENERAL_ERROR_MESSAGES',
  '/IPERF2_TELEMETRY',
  '/IPERF3_TELEMETRY',
  '/MPE_STATUS',
  '/PAL_CONFIG_STATUS',
  '/PAL_STATUS',
  '/PAL_TELEMETRY',
  '/PAL_TIMESYNC',
  '/PING_TELEMETRY',
  '/STATUS_AUTOTEST',
  '/THROUGHPUT_STARTED',
  '/TURNTABLE_STATUS',
  '/SNIFFER_STATUS'
]

EVENT_TABLE = """
  Namespaces                          Events
----------------------------------------------------------------
  '/ACTIVE_TEST'                      'ALL'
  '/ATTEN_STATUS'                     'ALL', device IPs
  '/AUTOTEST_STATUS'                  'ALL'
  '/AVG_PAL_TELEMETRY'                'AVG_PAL_TELEMETRY'
  '/AVG_PING_TELEMETRY'               'AVG_PING_TELEMETRY'
  '/AVGRSSI_TELEMETRY'                'AVGRSSI_TELEMETRY'
  '/AVGTHROUGHPUT_TELEMETRY'          'AVGTHROUGHPUT_TELEMETRY'
  '/CHARTS_DATA'                      'ALL'
  '/ETHERNET_STATUS'                  'ALL'
  '/GENERAL_ERROR_MESSAGES'           'ALL'
  '/IPERF2_TELEMETRY'                 'IPERF2_TELEMETRY'
  '/IPERF3_TELEMETRY'                 'IPERF3_TELEMETRY'
  '/MPE_STATUS'                       'ALL', device IPs
  '/PAL_CONFIG_STATUS'                'ALL'
  '/PAL_STATUS'                       'ALL', device IPs
  '/PAL_TELEMETRY'                    'ALL', device IPs
  '/PAL_TIMESYNC'                     'ALL'
  '/PING_TELEMETRY'                   'PING_TELEMETRY'
  '/STATUS_AUTOTEST'                  'ALL'
  '/THROUGHPUT_STARTED'               'ALL'
  '/TURNTABLE_STATUS'                 device IPs
  '/SNIFFER_STATUS'                   'ALL'
"""


class StardustSocketListen():
  """ Class for listening to and outputting Stardust's socket.io messages """

  def __init__(self, server_addr, namespace, event_name, callback=None):
    """ Constructor """

    # Validate input server IP address format
    self.server_addr = str(ipaddress.IPv4Address(server_addr))

    # Prepend '/' if missing and check if it's a recognized namespace
    self.namespace = namespace if namespace[0] == '/' else f'/{namespace}'
    if self.namespace not in VALID_NAMESPACES:
      raise ValueError(f'Unknown namespace: {namespace}')

    # Verify that the provided callback is a callable function or None
    if callback and not callable(callback):
      raise ValueError('Provided a Non-callable callback')
    self.callback = callback

    self.event_name = str(event_name)
    self.__is_connected = False # private

    self.sio = socketio.Client()
    # Additional loggging via:
    # self.sio = socketio.Client(logger=True)
    # self.sio = socketio.Client(logger=True, engineio_logger=True)

    @self.sio.on(self.event_name, namespace=self.namespace)
    def on_message(data): # pylint: disable=unused-variable
      """ Message handler """
      if callback:
        try:
          callback(data)
        except Exception as error:
          print('Error in provided callback function:')
          print(repr(error), error)
      else:
        print('Received data: ', data)
        print('---------------------------------------------------------------')

    @self.sio.on('connect', namespace=self.namespace)
    def on_connect(): # pylint: disable=unused-variable
      """ Connect handler """
      print(f"Connected to the {self.namespace} namespace.")

    @self.sio.on('disconnect', namespace=self.namespace)
    def on_disconnect(): # pylint: disable=unused-variable
      """ Disconnect handler """
      print(f"Disconnected to the {self.namespace} namespace.")


  @property
  def is_connected(self):
    """ Get is_connected state """
    return self.__is_connected


  @classmethod
  def get_namespaces(cls):
    """ Get the list of valid/recognized namespaces """
    return VALID_NAMESPACES


  @classmethod
  def get_events(cls):
    """ Get a table of default events (not validated) """
    return EVENT_TABLE


  def start(self):
    """ Start listening """
    try:
      if self.__is_connected:
        print('Already Connected')
      else:
        self.sio.connect(
          f'http://{self.server_addr}:{SOCKETIO_PORT}',
          namespaces=self.namespace
        )
        self.__is_connected = True
    except Exception as error:
      print(error)


  def stop(self):
    """ Stop listening """
    try:
      if not self.__is_connected:
        print('Already Disconnected')
      else:
        self.sio.disconnect()
        self.__is_connected = False
    except Exception as error:
      print(error)
