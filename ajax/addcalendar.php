<?php

// Init owncloud
OCP\JSON::checkLoggedIn();
OCP\JSON::checkAppEnabled('tasks');
OCP\JSON::callCheck();

function cmp($a, $b) {
        return strcmp($a['displayname'], $b['displayname']);
}

$calendars = OC_Calendar_Calendar::allCalendars(OCP\USER::getUser());
foreach($calendars as $cal) {
        if($cal['displayname'] == $_POST['name']) {
                OCP\JSON::error(array('message'=>'namenotavailable'));
                exit;
        }
}

$userid = OCP\USER::getUser();
$calendarid = OC_Calendar_Calendar::addCalendar($userid, strip_tags($_POST['name']), 'VEVENT,VTODO,VJOURNAL', null, 0, '#ff0000');
OC_Calendar_Calendar::setCalendarActive($calendarid, 1);

$calendars = OC_Calendar_Calendar::allCalendars(OCP\User::getUser(), true);

usort($calendars, 'cmp');

OCP\JSON::success(array('calendars' => $calendars));
