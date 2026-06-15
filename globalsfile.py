# #################################################################################
# This file contains variables that all scripts and libraries can access via import
# Edited: 1/18/24	Added scriptSuiteVersion back and update from paramsDict
# Edited: 1/26/24	Removed scriptSuiteVersion
# Edited: 7/11/22 - Added makeArequestRetry
# #################################################################################

# DO NOT SET THIS. Will be automatically determined during script execution
starDustVersion = ""

# These are for Pal/STApal real time status
# Your values may be different. Edit as needed.
targetMgmtip = None			# Pal radio management IP address to check
targetTrafficip = None		# Pal radio traffic IP address to check
targetFound = False			# Status result. True if mgmt IP and radio type found in RT data, false if not
targetIpFound = False		# Status result. True if mgmt IP found, false if not
targetRadio = None			# RADIO_24|RADIO_5|RADIO_5A|RADIO_5B|RADIO_6|RADIO_245|RADIO_2456
channelFound = 0			# Associated primary channel
bssidFound = ''				# Associated BSSID
trafficIpFound = ''			# Associated Traffic IP
macAddressFound = ''		# Associated Pal MAC address
phyMode = ''				# Associated PHY mode
maxBandwidth =''			# Associated maxBandwidth
vstaAssociatedCount = 0		# Associated # of vSTAs
noPalStatus = False			# True if no data returned from PalStatus callback
radioMode = 'STA'			#"AP" or "STA"
radioState = ''				# Status stream radioState
online = False				# Status result. True if Pal is online, False if not
associated = False			# Status result. True if Pal is associated, False if not
rssiMgmtMean = 0			# Management RSSI mean 
rssiMgmtMeanList = []		# Management RSSI mean list for lookback
rssiDataMean = 0			# Data RSSI mean
rssiDataMeanList = []		# Data RSSI mean list for lookback
palStatus = None			# Status returned from getPalStatus
palTelemetry = None			# Status returned from getTelemetry
palTelemetryTimeStamp = 0	# Time stamp from palTelemetry check
palTelemetryServerTimestamp = 0 # Server time stamp from palTelemetry check
palStatusTimeStamp =''		# Time stamp from Pal Status check
palStatusServerTimestamp = ''	# Server time stamp from Pal Status check
scanList = []				# Pal scan scanList dict
avgThroughputSample = ""	# Average throughput sample from AVGTHROUGHPUT_TELEMETRY RT stats namespace
trafficValue = ""			# Result returned from traffic monitor
testWarning = ""			# Result returned from calibration

# Test related globals
# Your values may be different. Edit as needed
activeTest = ""				# Name of test that is running
outputDirPath = ''			# Path to test result output directory
resultsPath = ''			# Path to testresultlog.json
isTestRunning = False		# Autotest status
isTrafficRunning = False	# Throughput traffic flag
fileSuffix = ''				# File name or path suffix 
quadAttenStart = ''			# attenuator RvR Start value
quadAttenStop = ''			# attenuator RvR Stop value
serverTimestamp = ''		# Server time stamp
timeStamp = ''				# Timestamp for filenames taken at start of test script, string format
timeStampts = 0				# Timestamp for time calculation taken at start of test script, numeric format
latestTimeStamp = ''		# Timestamp for filenames taken at start of traffic
goRampStartTimeStamp = 0	# Start of attenuator go ramp time stamp
returnRampStartTimeStamp = 0	# Start of attenuator return ramp time stamp
autoTestStartTimeStamp = 0		# Start of autotest time stamp
autoTestEndTimeStamp = 0		# End of autotest time stamp
autoTestDuration = 0		# Autotest duration (seconds)
snifferStartTime = 0		# Timestamp for sniffing start
atten1Value = 0				# Playback attenuator 1 value
atten1Name = ''				# Playback attenuator 1 name
atten2Value = 0				# Playback attenuator 2 value
atten2Name = ''				# Playback attenuator 2 name
atten3Value = 0				# Playback attenuator 3 value
atten3Name = ''				# Playback attenuator 3 name
atten4Value = 0				# Playback attenuator 4 value
atten4Name = ''				# Playback attenuator 4 name
triBand = False				# Mesh discovery found Triband AP
has6e = False				# DUT supports 6 GHz
palFWdict = {}				# Pal/STApal firmware versions
tpIpList = []				# List of traffic pair IP addresses
tpIpDict = {}				# Dict of traffic pair IP addresses by Palname
makeArequestRetry = True	# Set true to retry requests
funcsCanTerminate = True	# Set true to allow sd2Utils functions to terminate script on error.
frankensteinAddress = ''	# Traffic IP address for Pal6 AP 
autoTestAborted = False		# True if autoTest was stopped before completion (due to STA disconnect)
alertMessage = ''			# Alert messages for Script Manager display
msgId = 0					# Counter for warning messages
msgWarn = {'WARNING':{}}	# Dict for warning messages

# Roaming globals for use with old roam check method
roamEventFlag = False		# Flag from roamCheck. True if roam Event detected
roamEventCount = 0			# Running total of roam events
roamFailFlag = False		# True
checkTime = 0				# Elapsed time from autoTest (traffic) start
sniffTime = 0				# Elapsed time from sniffer start

# For checking script run from command line
runFromScriptMachineFlag=False
hostIpAddress = ''
hostName = ''


# #####################################################################################
# ########### Start of main routine. Should not be edited. ###########
# #####################################################################################
import sys
import os
import json
import socket
import datetime
from datetime import datetime
import pprint
pp = pprint.PrettyPrinter(indent=4)
import subprocess
import re

try:
    #directory_name=sys.argv[1]
    #print("The directory name passed in is {}.".format(directory_name),flush=True)
    directory_name = "./"   #MCP SERVER WORK
except:
    #print('No directory_name provided, so using ./',flush=True)
    directory_name = "./"

print('### globalsfile - directory_name: ', directory_name)

testMessageFile = directory_name + 'TestMessages.json'
# Clean up file
if os.path.exists(testMessageFile):
    os.remove(testMessageFile)

print('')
print('#####################################################')
current_file_path = os.path.abspath(__file__)
print("### globalsfile - Current file path:", current_file_path)

if os.path.islink(current_file_path):
	target_path = os.readlink(current_file_path)
	print('#####################################################')
	print(f"### globalsfile - The file at '{current_file_path}' is a symbolic link.")
	print(f"### globalsfile - The target of the symbolic link at '{current_file_path}' is '{target_path}'.")
	print("### globalsfile - You are using the most current version of globalsfile.py.")
else:
	print('################## WARNING #########################')
	print(f"### globalsfile - The file '{current_file_path}' is not a symbolic link.")
	print(f"### globalsfile - This file may not be the most current.")
	print(f"### globalsfile - The most current globalsfile.py is located in /octoscope/scriptMachine/script-home/common.")

	alertMessage =alertMessage+ "WARNING! The file <i>"+current_file_path+"</i> is not a symbolic link. This file may not be the most current.  The most current <i>globalsfile.py</i> is located in <i>/octoscope/scriptMachine/script-home/common</i>. Update your script-home to get the <i>common</i> folder and create a symbolic link to <i>/octoscope/scriptMachine/script-home/common/globalsfile.py</i> in the mesh root folder. "

	# Write message to Script Manager
	print('### globalsfile - directory_name: ', directory_name)
	jsonMessages = {}

	jsonMessages["alertMessage"] = {
		"val": {
			"_scriptMessage_": alertMessage},
		"label": "Alerts"}
	jsonMessages["_editable"] = False
	f = open(directory_name + 'TestMessages.json', "w+")
	f.write(json.dumps(jsonMessages, indent=4))
	f.close()
	print("### globalsfile: Test messages have been written to "+directory_name + "TestMessages.json")
print('#####################################################')

#######################################################################
# Name: 
#   getParamsDict
# Description: Retrieves dictionary of all test, system and analyses parameters
#
# Parameters: 
#	directory_name: directory from sys.argv[1]
#
# Returns: 
#	paramsDict: Merged test, system and analyses parameter dictionaries
#
#

def getParamsDict(directory_name):
	global runFromScriptMachineFlag
	global hostIpAddress
	global hostName
	# Read in params and test file JSONs
	#sysParamsFile = directory_name + '../params_system.json'
	sysParamsFile = directory_name + './params_system.json'   #FOR MCP WORK
	#print('>>> sysParamsFile: ', sysParamsFile)
	testParamsFile = directory_name + 'params_test.json'
	#print('>>> testParamsFile: ', testParamsFile)
	#analysesFile = directory_name + 'analyses.json'
	analysesFile = None
	directoriesFile = directory_name + 'directories.json'

	# Read system params json and store in dictionary
	with open(sysParamsFile, 'r') as data:
		sysParamsDict = json.load(data)
		#print('>>>sysParamsDict.keys: ', sysParamsDict.keys())
	data.close()

	# Read test params json and store in dictionary
	with open(testParamsFile, 'r') as data:
		testParamsDict = json.load(data)
	#print('>>>testParamsDict.keys: ', testParamsDict.keys())
	data.close()

	if analysesFile:
		# Read analyses json and store in dictionary
		with open(analysesFile, 'r') as data:
			analysesDict = json.load(data)
		#print('>>>analysesDict.keys: ', analysesDict.keys())
		data.close()
		
	# Merge dictionaries
	if analysesFile:
		paramsDict = {**sysParamsDict,**testParamsDict, **analysesDict}
	else:
		paramsDict = {**sysParamsDict,**testParamsDict}
	#print('>>>paramsDict.keys: ', paramsDict.keys())
	#print('>>> sys.argv: ' , sys.argv)

	if sys.argv[0]:
		sysargsLength = len(sys.argv[0].split('/'))
		#print(f'\n>>> getParamsDict sysargsLength: {sysargsLength}')
		#print(f'\n>>> getParamsDict sys.argv[0]: {sys.argv[0]}')

		if sysargsLength > 1:
			runFromScriptMachineFlag = True
			print('>>> globalsfile getParamsDict Script run by Script Manager (sysargsLength: %s).' % sysargsLength)
		else:
			print('>>> globalsfile getParamsDict Script run from Command line (sysargsLength: %s).' % sysargsLength)
	else:
		print("### globalsfile getParamsDict: ERROR Cannot get sys.argv. QUITTING!")
		sys.exit()

	# Check for Script Manager port to make sure no SM is present
	portNum = 5678
	print('>>> globalsfile getParamsDict ScriptManager port: ', portNum)
	smRunningFlag=False
	with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
		print(f'### globalsfile getParamsDict sock: {sock}')
		smPortFlag = sock.connect_ex(('localhost', portNum))
		print('### globalsfile getParamsDict smPortFlag: ', smPortFlag)

		if not smPortFlag:
			smRunningFlag=True
			print('>>> globalsfile getParamsDict: Port %s is in use. Script Manager FOUND.' % portNum)
		else:
			print('>>> globalsfile getParamsDict: Port %s is NOT in use. Script Manager NOT FOUND.' % portNum)

		''' Getting rid of this since it can get messed up if scriptMachine is connected to VPN
		hostname = socket.gethostname()
		print('>>> globalsfile getParamsDict hostname: ', hostname)
		hostIpAddress = socket.gethostbyname(hostname)
		print('>>> globalsfile getParamsDict hostIpAddress: ', hostIpAddress)
		'''

		def get_local_ip():
			output = subprocess.check_output(["ip", "addr"], encoding="utf-8")
			ips = re.findall(r'inet (\d+\.\d+\.\d+\.\d+)/\d+', output)
			local_ips = [ip for ip in ips if not ip.startswith("127.") and not ip.startswith("172.")]
			return local_ips[0] if local_ips else None

		hostIpAddress = get_local_ip()
		print(f'>>> globalsfile getParamsDict hostIpAddress:{hostIpAddress}')

	# Read directories info json and store in dictionary. If file doesn't exist create a simplified version.
	# This is for case of running script without script machine
	# If script is run from command line, create a directories.json
	# Otherwise, leave the one created by Script Manager

	if not runFromScriptMachineFlag:
		print('\n##################################################')
		print('>>> globalsfile getParamsDict: Script run from command line. Create or overwrite directories.json and add to paramsDict.')
		try:
			test_param_alt_file=sys.argv[2]
			print(">>> globalsfile getParamsDict: The parameters file name passed in is {}.".format(test_param_alt_file))
		except:
			print('>>> globalsfile getParamsDict: No parameters file name provided')
			test_param_alt_file = None

		dutId = paramsDict['dut']['val']['dutId']
		print('>>> globalsfile getParamsDict dutId: ', dutId)
		testName = paramsDict['testName']['val']
		print('>>> globalsfile getParamsDict testName: ', testName)
		dateOfStart = datetime.now().strftime("%Y-%m-%d")
		timeOfStart = datetime.now().strftime("%H-%M")
		topDirectory = dateOfStart+'_'+timeOfStart+'_'+dutId
		subDirectory = '1_'+dateOfStart+'_'+timeOfStart+'_'+testName
		commandLine = test_param_alt_file
		directoriesDict = {}
		directoriesDict.update({
		"topDirectory":topDirectory,
		"dateOfStart": dateOfStart,
		"timeOfStart": timeOfStart,
		"subDirectory":subDirectory,
		"commandLine":commandLine,
		"title":testName, 
		"scriptManagerLocation": {},
		"runFromScriptMachineFlag":runFromScriptMachineFlag,
		"smRunningFlag":smRunningFlag})

		#hostname = socket.gethostname()
		#print('### hostname: ', hostname)
		#hostIpAddress = socket.gethostbyname(hostname)
		try:
			f = open(directoriesFile, "w")
			f.write(json.dumps(directoriesDict, indent=4))
			f.close()
			print("### globalsfile getParamsDict: %s CREATED." % directoriesDict)
		except:
			print("### globalsfile getParamsDict: Cound not write %s. QUITTING!" % directoriesDict)
			sys.exit()
	else:
		print('\n##################################################')
		print('>>> globalsfile getParamsDict: Script run from Script Manager. Read file and update paramsDict')
		# Read the directories.json file created by Script Manager 
		try:
			f = open(directoriesFile, 'r')
			directoriesDict = json.load(f)
			f.close()
		except:
			print("### globalsfile getParamsDict: Cound not read %s. QUITTING!" % directoriesDict)
			sys.exit()

	print('>>> globalsfile getParamsDict directoriesDict: ')
	pp.pprint(directoriesDict)

	paramsDict.update(directoriesDict)

	return paramsDict

print(">>> globalsfile: Getting/assembling paramsDict")
paramsDict = getParamsDict(directory_name)

# Need to do this to here so we don't have to go back and edit all scripts
if 'scriptSuiteVersion' in paramsDict.keys():
	scriptSuiteVersion = paramsDict['scriptSuiteVersion']['val']
else:
	scriptSuiteVersion = "no_version_set"
print('')
print('#####################################################')
print('##### scriptSuiteVersion: ', scriptSuiteVersion)
print('#####################################################')

autotest_dict = {
	"description": "",
	"model": "",
	"name": "",
	"revision": "",
	"rvrMode": "",
	"synchroSnifferCapturing":False,
	"trainingInterval": 0,
	"stepDuration": 0,
	"step": 0,
	"wiresharkHost": "",
	"quadAttens": [], 
	"virtualAttens": [],
	"mpes": [],  
	"virtualMpes": [],
	"pal6s": [],
	"pal7s": [],
	"staPals": [],
	"staPal7s": [],
	"synchroSniffers": [],  
	"snifferDisplay": [],  
	"trafficPairs": [],  
	"turntables": []
	}

