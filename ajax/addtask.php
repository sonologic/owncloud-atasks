<?php

// Init owncloud
OCP\JSON::checkLoggedIn();
OCP\JSON::checkAppEnabled('tasks');
OCP\JSON::callCheck();

//$calendars = OC_Calendar_Calendar::allCalendars(OCP\User::getUser(), true);
//$first_calendar = reset($calendars);
//$cid = $first_calendar['id'];

// @todo: validate
$cid = $_POST['calendar']+0;

$input = $_POST['text'];
$request = array();
$request['summary'] = $input;
$request["categories"] = null;
$request['priority'] = null;
$request['percent_complete'] = null;
$request['completed'] = null;
$request['location'] = null;
$request['due'] = null;
$request['description'] = null;
$vcalendar = OC_ATask_App::createVCalendarFromRequest($request);
$id = OC_Calendar_Object::add($cid, $vcalendar->serialize());

$user_timezone = OC_Calendar_App::getTimezone();
$task = OC_ATask_App::arrayForJSON($id, $vcalendar->VTODO, $user_timezone);

OCP\JSON::success(array('task' => $task));
