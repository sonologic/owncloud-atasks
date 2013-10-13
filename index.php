<?php
/*************************************************
 * ownCloud - Tasks Plugin                        *
 *                                                *
 * (c) Copyright 2011 Bart Visscher               *
 * This file is licensed under the Affero General *
 * Public License version 3 or later.             *
 * See the COPYING-README file.                   *
 *************************************************/

OCP\User::checkLoggedIn();
OCP\App::checkAppEnabled('atasks');

if (!OCP\App::isEnabled('calendar')) {
	OCP\Template::printUserPage('tasks', 'no-calendar-app');
	exit;
}

$calendars = OC_Calendar_Calendar::allCalendars(OCP\User::getUser(), true);
if( count($calendars) == 0 ) {
	header('Location: ' . OCP\Util::linkTo('calendar', 'index.php'));
	exit;
}

OCP\Util::addScript('3rdparty/timepicker', 'jquery.ui.timepicker');
OCP\Util::addStyle('3rdparty/timepicker', 'jquery.ui.timepicker');
OCP\Util::addScript('atasks', 'atasks');
OCP\Util::addStyle('atasks', 'style');
OCP\Util::addScript('contacts', 'jquery.multi-autocomplete');
OCP\Util::addScript('', 'oc-vcategories');
OCP\App::setActiveNavigationEntry('atasks_index');

$priority_options = OC_ATask_App::getPriorityOptions();
$output = new OCP\Template('atasks', 'tasks', 'user');
$output->assign('priority_options', $priority_options);
$output -> printPage();
