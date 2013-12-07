module.exports = function(grunt) {
    grunt.initConfig({
        bower: {
            install: {
                options: {
                    targetDir: './_resources/lib',
                    cleanBowerDir: true
                }
            }
        },
        cssmin: {
            default: {
                files: {
                    'assets/default.min.css': [
                        '_resources/lib/totop/css/ui.totop.css',
                        '_resources/css/*.css'
                    ]
                }
            }
        },
        copy: {
            totop: {
                files: [{
                    src: [ '_resources/lib/totop/img/ui.totop.png' ],
                    dest: 'images/totop.png'
                }]
            }
        },
        replace: {
            totop: {
                options: {
                    patterns: [{
                        match: /url\(\.\.\/img\/ui\.totop\.png\)/g,
                        replacement: 'url(/images/totop.png)',
                        expression: true
                    }]
                },
                files: [{
                    src: [ 'assets/default.min.css' ],
                    dest: 'assets/default.min.css'
                }]
            }
        },
        uglify: {
            default: {
                files: {
                    'assets/default.min.js': [
                        '_resources/lib/anchorify/anchorify.min.js' ,
                        '_resources/lib/totop/js/jquery.ui.totop.min.js',
                        '_resources/js/*.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bower-task');

    grunt.registerTask('build', [ 'bower:install', 'cssmin', 'copy', 'replace', 'uglify' ]);
};
