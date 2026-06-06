sudo launchctl unload /Library/LaunchDaemons/com.canonical.multipassd.plist
sudo rm -rf /var/root/Library/Application\ Support/multipassd
sudo launchctl load /Library/LaunchDaemons/com.canonical.multipassd.plist