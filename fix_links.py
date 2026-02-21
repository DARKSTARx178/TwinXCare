import glob
import os

files = glob.glob('/Users/ETHAN/Documents/TwinXCare/public/app/*.html')
for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Replace app.css
    content = content.replace('href="app.css"', 'href="/app/app.css"')
    
    # Replace html links
    content = content.replace('href="index.html"', 'href="/app/index.html"')
    content = content.replace('href="explore.html"', 'href="/app/explore.html"')
    content = content.replace('href="services.html"', 'href="/app/services.html"')
    content = content.replace('href="delivery.html"', 'href="/app/delivery.html"')
    content = content.replace('href="settings.html"', 'href="/app/settings.html"')
    
    # Replace relative image if any just in case, though they are absolute /assets
    
    with open(file, 'w') as f:
        f.write(content)

print("Fixed links.")
