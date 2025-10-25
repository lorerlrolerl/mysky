[app]

# (str) Title of your application
title = MySky Weather

# (str) Package name
package.name = mysky

# (str) Package domain (needed for android/ios packaging)
package.domain = com.mysky.weather

# (str) Source code where the main.py live
source.dir = .

# (list) Source files to include (let empty to include all the files)
source.include_exts = py,png,jpg,kv,atlas

# (str) Application versioning (method 1)
version = 0.1.0

# (list) Application requirements
# comma separated e.g. requirements = sqlite3,kivy
requirements = python3==3.12,kivy,openmeteo-requests,requests-cache,kivy_garden.graph

# (str) Supported orientation (landscape, sensorLandscape, sensor or any of the previous with 'portrait' prefix)
orientation = portrait

# (list) List of service to declare
#services = NAME:ENTRYPOINT_TO_PY,NAME2:ENTRYPOINT2_TO_PY

#
# OSX Specific
#

#
# author = © Copyright Info

# change the major version of python used by the app
osx.python_version = 3

# Kivy version to use
osx.kivy_version = 2.3.0

#
# Android specific
#

# (bool) Indicate if the application should be fullscreen or not
fullscreen = 0

# (str) Android app icon
android.icon = assets/app_icon.png

# (string) Presplash background color (for android toolkit)
# Supported formats are: #RRGGBB #AARRGGBB or one of the following names:
# red, blue, green, black, white, gray, cyan, magenta, yellow, lightgray,
# darkgray, grey, lightgrey, darkgrey, aqua, fuchsia, lime, maroon, navy,
# olive, purple, silver, teal.
#android.presplash_color = #FFFFFF

# (string) Presplash animation using Lottie format.
# see https://lottiefiles.com/ for examples and https://airbnb.design/lottie/
# for general documentation.
# Lottie files can be created using various tools, like Adobe After Effects or Synfig.
#android.presplash_lottie = "path/to/lottie/file.json"

# (str) Adaptive icon of the application (used if Android API level is 26+ at runtime)
#android.adaptive_icon_foreground = "path/to/adaptive-icon-foreground.png"
#android.adaptive_icon_background = "path/to/adaptive-icon-background.png"

# (list) Permissions
android.permissions = INTERNET

# (list) Android application meta-data to set (key=value format)
#android.meta_data =

# (list) Android library project to add (will be added in the
# project.properties automatically.)
#android.library_references = @jar/foo.jar:@jar/bar.jar

# (list) Android shared libraries which will be added to AndroidManifest.xml using <uses-library> tag
#android.uses_library =

# (str) Android logcat filters to use
#android.logcat_filters = *:S python:D

# (bool) Copy library instead of making a libs symlink
#android.copy_libs = 1

# (str) The Android arch to build for, choices: armeabi-v7a, arm64-v8a, x86, x86_64
android.arch = arm64-v8a

# (int) overrides automatic versionCode computation (used in build.gradle)
# this is not the same as app version and should only be edited if you know what you're doing
# android.numeric_version = 1

# (bool) enables Android auto backup feature (Android API >=23)
android.allow_backup = True

# (str) XML file for custom backup rules (see official auto backup documentation)
# android.backup_rules = res/xml/backup_rules.xml

# (str) If you need to insert variables into your AndroidManifest.xml file,
# you can do so with the manifestPlaceholders property.
# This property takes a map of key-value pairs. (via a string)
#android.manifest_placeholders = key:value,key2:value2

# (bool) Skip byte compile for .py files
# android.no_bytecode_python = False

# (str) The format used to package the app for release mode (aab or apk).
# android.release_artifact = aab

# (str) The format used to package the app for debug mode (apk or aab).
# android.debug_artifact = apk

#
# Python for android (p4a) specific
#

# (str) python-for-android fork to use, defaults to upstream (kivy)
#p4a.fork = kivy

# (str) python-for-android branch to use, defaults to master
#p4a.branch = master

# (str) python-for-android git clone directory (if empty, it will be automatically cloned from github)
#p4a.source_dir =

# (str) The directory in which python-for-android should look for your own build recipes (if any)
#p4a.local_recipes =

# (str) Filename to the hook for p4a
#p4a.hook =

# (str) Bootstrap to use for android builds
# p4a.bootstrap = sdl2

# (int) port number to specify an explicit --port= p4a argument (eg for bootstrap flask)
#p4a.port =

# Control passing the --use-setup-py vs --ignore-setup-py to p4a
# "in the future" --use-setup-py is going to be the default behaviour in p4a, right now it is not
# Setting this to false will --ignore-setup-py, true will --use-setup-py
#p4a.setup_py = False

# (str) extra command line arguments to pass when invoking pythonforandroid.toolchain
#p4a.extra_args =

#
# iOS specific
#

# (str) Path to a custom kivy-ios folder
#ios.kivy_ios_url = https://github.com/kivy/kivy-ios
# Alternatively specify the URL and branch of a git checkout:
ios.kivy_ios_url = https://github.com/kivy/kivy-ios
ios.kivy_ios_branch = master

# Another platform dependency: ios-deploy
# Uncomment to use a custom checkout
#ios.ios_deploy_url = https://github.com/phonegap/ios-deploy
#ios.ios_deploy_branch = 1.7.0

# (bool) Whether or not to sign the code
ios.codesign.allowed = false

# (str) Name of the certificate to use for signing the debug version
# Get a list of available identities: security find-identity -v -p codesigning
#ios.codesign.debug = "iPhone Developer: <lastname> <firstname> (<hexstring>)"

# (str) The development team to use for signing the debug version
#ios.codesign.development_team.debug = <hexstring>

# (str) Name of the certificate to use for signing the release version
#ios.codesign.release = %(ios.codesign.debug)s

# (str) The development team to use for signing the release version
#ios.codesign.development_team.release = <hexstring>

# (str) URL pointing to .ipa file to be installed
# This option should be defined along with `title` and `package.name` options.
#ios.manifest.app_url =

# (str) Application display name to be set in the .ipa file
#ios.manifest.app_name = My Application

# (str) Application version to be set in the .ipa file
#ios.manifest.version = %(version)s

# (str) Application name to be set in the .ipa file
#ios.manifest.name = %(title)s

# (str) URL pointing to an icon file to be set in the .ipa file
#ios.manifest.icon_57x57 = %(source.dir)s/data/icon-57x57.png

# (str) URL pointing to a larger icon file to be set in the .ipa file
#ios.manifest.icon_72x72 = %(source.dir)s/data/icon-72x72.png

# (str) URL pointing to an icon file to be set in the .ipa file
#ios.manifest.icon_76x76 = %(source.dir)s/data/icon-76x76.png

# (str) URL pointing to an icon file to be set in the .ipa file
#ios.manifest.icon_120x120 = %(source.dir)s/data/icon-120x120.png

# (str) URL pointing to an icon file to be set in the .ipa file
#ios.manifest.icon_152x152 = %(source.dir)s/data/icon-152x152.png

# (str) URL pointing to an icon file to be set in the .ipa file
#ios.manifest.icon_180x180 = %(source.dir)s/data/icon-180x180.png

# (str) Path to the entitlements file to use for signing the release version
#ios.entitlements_file = %(source.dir)s/entitlements.plist

# (str) Path to the entitlements file to use for signing the debug version
#ios.entitlements_file.debug = %(source.dir)s/entitlements.plist

# (str) Path to the xcode project to use
#ios.xcodeproj = %(source.dir)s/MyApplication-ios.xcodeproj

#
# Buildozer
#

# (int) Log level (0 = error only, 1 = info, 2 = debug (with command output))
log_level = 2

# (int) Display warning if buildozer is run as root (0 = False, 1 = True)
warn_on_root = 1

# (str) Path to build artifact storage, absolute or relative to spec file
# build_dir = ./.buildozer

# (str) Path to build output (i.e. .apk, .ipa) storage
# bin_dir = ./bin

#    -----------------------------------------------------------------------------
#    List as sections
#
#    You can define all the "list" as [section:key].
#    Each line will be considered as a option to the list.
#    Let's see [app] / source.exclude_patterns.
#    Instead of doing:
#
#[app]
#source.exclude_patterns = license,images/icon/*.png
#
#    This can be translated into:
#
#[app:source.exclude_patterns]
#license
#images/icon/*.png
#

#    -----------------------------------------------------------------------------
#    Profiles
#
#    You can extend section / key with a profile
#    For example, you want to deploy a demo version of your application without
#    HD content. You could first change the title to add "(demo)" in the name
#    and extend the excluded directories to remove the HD content.
#
#[app@demo]
#title = My Application (demo)
#
#[app:source.exclude_patterns@demo]
#images/hd/*
#
#    Then, invoke the command line with the "demo" profile:
#
#buildozer --profile demo android debug
