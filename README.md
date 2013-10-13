ATasks for owncloud
===================

ATasks is a fork of the owncloud native tasks app. The rationale is that 
the current tasks app is quite unusable.

Goals are:
- provide task lists compatible with a GTD workflow
- better integration with task apps on android
- less bugs

Installation
============

Put the contents of this repository under the apps dir in your owncloud
root. Ie:

cd /tmp
git clone https://github.com/sonologic/owncloud-atasks.git
mv owncloud-atasks ${OC_ROOT}/apps/atasks

Next, enable the ATasks app in the owncloud administration interface.

