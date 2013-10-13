<?php
$l=new OC_L10N('atasks');
OC::$CLASSPATH['OC_ATask_App'] = 'atasks/lib/app.php';

OCP\App::addNavigationEntry( array(
  'id' => 'atasks_index',
  'order' => 11,
  'href' => OCP\Util::linkTo( 'atasks', 'index.php' ),
  'icon' => OCP\Util::imagePath( 'atasks', 'atasks.svg' ),
  'name' => $l->t('ATasks')));
