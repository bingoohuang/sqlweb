#!/usr/bin/env bash

cdn_provider="https://cdnjs.cloudflare.com/ajax/libs"

echo "cdn_provider is $cdn_provider" 

mkdir -p static/
cd static

# css resources
rm -fr codemirror.min.css
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/codemirror.min.css
curl -LO ${cdn_provider}/codemirror/5.42.2/codemirror.min.css

rm -fr show-hint.min.css
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/addon/hint/show-hint.min.css
curl -LO ${cdn_provider}/codemirror/5.42.2/addon/hint/show-hint.min.css

rm -fr jquery-confirm.min.css
#curl -LO https://cdn.bootcss.com/jquery-confirm/3.3.2/jquery-confirm.min.css
curl -LO ${cdn_provider}/jquery-confirm/3.3.3/jquery-confirm.min.css

rm -fr select2.min.css
#curl -LO https://cdn.bootcss.com/select2/4.0.6-rc.1/css/select2.min.css
curl -LO ${cdn_provider}/select2/4.0.6-rc.1/css/select2.min.css

# javascript resources
rm -fr vue.min.js
#curl -LO https://cdn.bootcss.com/vue/2.5.21/vue.min.js
curl -LO ${cdn_provider}/vue/2.5.21/vue.min.js
rm -fr jquery.min.js
#curl -LO https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
curl -LO ${cdn_provider}/jquery/3.3.1/jquery.min.js
rm -fr codemirror.min.js
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/codemirror.min.js
curl -LO ${cdn_provider}/codemirror/5.42.2/codemirror.min.js

rm -fr sql.min.js
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/mode/sql/sql.min.js
curl -LO ${cdn_provider}/codemirror/5.42.2/mode/sql/sql.min.js

rm -fr sql-hint.min.js
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/addon/hint/sql-hint.min.js
curl -LO ${cdn_provider}/codemirror/5.42.2/addon/hint/sql-hint.min.js

rm -fr show-hint.min.js
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/addon/hint/show-hint.min.js
curl -LO ${cdn_provider}/codemirror/5.42.2/addon/hint/show-hint.min.js

rm -fr toml.min.js
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/mode/toml/toml.min.js
curl -LO ${cdn_provider}/codemirror/5.42.2/mode/toml/toml.min.js

rm -fr placeholder.min.js
#curl -LO https://cdn.bootcss.com/codemirror/5.42.2/addon/display/placeholder.min.js
curl -LO ${cdn_provider}/codemirror/5.42.2/addon/display/placeholder.min.js

rm -fr jquery.contextMenu.min.js
#curl -LO https://cdn.bootcss.com/jquery-contextmenu/2.7.1/jquery.contextMenu.min.js
curl -LO ${cdn_provider}/jquery-contextmenu/2.7.1/jquery.contextMenu.min.js

rm -fr jquery.ui.position.min.js
#curl -LO https://cdn.bootcss.com/jquery-contextmenu/2.7.1/jquery.ui.position.min.js
curl -LO ${cdn_provider}/jquery-contextmenu/2.7.1/jquery.ui.position.min.js

rm -fr sql-formatter.min.js
curl -LO https://cdn.jsdelivr.net/npm/sql-formatter@2.3.2/dist/sql-formatter.min.js

rm -fr jquery-confirm.min.js
#curl -LO https://cdn.bootcss.com/jquery-confirm/3.3.2/jquery-confirm.min.js
curl -LO ${cdn_provider}/jquery-confirm/3.3.2/jquery-confirm.min.js

rm -fr select2.min.js
#curl -LO https://cdn.bootcss.com/select2/4.0.6-rc.1/js/select2.min.js
curl -LO ${cdn_provider}/select2/4.0.6-rc.1/js/select2.min.js
