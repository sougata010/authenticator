require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "authenticator-bridge"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/sougata010/authenticator"
  s.license      = "MIT"
  s.authors      = { "Author" => "sougata" }
  s.platforms    = { :ios => "12.4" }
  s.source       = { :git => "https://github.com/sougata010/authenticator.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}", "../../core/src/*.cpp"
  s.compiler_flags = '-std=c++17'

  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/../../core/include\""
  }

  s.dependency "React-Core"
end
